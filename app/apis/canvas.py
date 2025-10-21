from enum import Enum
from fastapi import WebSocket
from typing import Any, Optional, Dict
import os

from llamaindex_workflows.design_expert.workflow import WorkflowResult
from server_app import app
from workflows.handler import WorkflowHandler
from schemas.canvas import ChatCompletionRequest, DefaultResponse

from llamaindex_workflows.design_expert import (
    DesignExpertWorkflow,
    ProgressEvent,
    DesignExpertWorkflowConfig,
)

from openinference.instrumentation.llama_index import LlamaIndexInstrumentor
from phoenix.otel import register


class CanvasApi:

    prefix: str = ""
    ws_completion_endpoint: str = "completion"

    get_workflows_endpoint: str = "workflows"

    instrumentor: Optional[LlamaIndexInstrumentor] = None

    def __init__(
        self,
        prefix: str
    ):
        self.prefix = prefix

        tracer_provider = register(
            endpoint='http://phoenix.intranet/v1/traces',
            project_name='Design RAG'
        )
        self.instrumentor = LlamaIndexInstrumentor()
        self.instrumentor.instrument(tracer_provider=tracer_provider)

        app.add_websocket_route(
            path=self._merge_path(self.ws_completion_endpoint),
            route=self._start_completion_wrapper,
        )

    def _merge_path(self, opt: str):
        return "/" + self.prefix.strip("/") + "/" + opt.strip("/")

    async def _start_completion_wrapper(self, websocket: WebSocket):
        try:
            await websocket.accept()
            if self.instrumentor:
                await self.start_with_observability(websocket)
            else:
                await self.completion(websocket)
        except (ValueError, KeyError, TypeError) as error:
            response = DefaultResponse(type="error", content=f"Invalid request: {str(error)}")
            await websocket.send_json(response.dump())
        except (ConnectionError, TimeoutError, OSError) as error:
            response = DefaultResponse(type="error", content=f"Connection error: {str(error)}")
            await websocket.send_json(response.dump())
        except Exception as error:  # pylint: disable=broad-except
            response = DefaultResponse(type="error", content=f"Unexpected error: {str(error)}")
            await websocket.send_json(response.dump())
        finally:
            await websocket.close()

    async def start_with_observability(self, websocket: WebSocket):
        assert self.instrumentor
        await self.completion(websocket)

    async def completion(self, websocket: WebSocket):
        try:

            request = await websocket.receive_json()
            chatCompletionRequest = ChatCompletionRequest.model_validate(request)
            await websocket.send_json(
                DefaultResponse(type="confirmation", content="Starting workflow").dump()
            )

            workflow_kvargs = DesignExpertWorkflowConfig.init_from_request(
                request=chatCompletionRequest
            )
            workflow = DesignExpertWorkflow(**workflow_kvargs)
            # model = chatCompletionrequest.model or ""

            # we pass it to the workflow
            workflow_run_kvargs = DesignExpertWorkflowConfig.run_from_request(
                request=chatCompletionRequest
            )
            handler: WorkflowHandler = workflow.run(**workflow_run_kvargs)

            # now we handle events coming back from the workflow
            async for event in handler.stream_events():
                if isinstance(event, ProgressEvent):
                    await websocket.send_json(
                        DefaultResponse(type="event", payload=event.model_dump()).model_dump()
                    )

            final_result: WorkflowResult = await handler

            accumulated_response = {
                "full_response": "",
                "full_followup": "",
                "nodes": final_result.nodes,
                "generated_tokens": 0,
            }

            for response in final_result.async_response_gen:
                accumulated_response["generated_tokens"] += 1
                accumulated_response["full_response"] += str(response.delta)
                _last_response = response
                await websocket.send_json(
                    DefaultResponse(
                        type="completion.chunk", content=str(response.delta)
                    ).model_dump()
                )

            if final_result.nodes:
                await websocket.send_json(
                    DefaultResponse(
                        type="completion.sources",
                        payload=[node.model_dump() for node in final_result.nodes],
                    ).model_dump()
                )

            await websocket.send_json(
                DefaultResponse(
                    type="completion.usage",
                    payload={
                        "generated_tokens": accumulated_response["generated_tokens"],
                        # "traceId": trace.trace_id if trace is not None else None,
                    },
                ).model_dump()
            )

            # if trace:
                # trace.create_event(name="Generation.Complete", output=accumulated_response)

        except (ValueError, KeyError, TypeError) as exception:
            await websocket.send_json(
                DefaultResponse(
                    type="error",
                    payload={
                        "error": f"Invalid request: {str(exception)}",
                        # "traceId": trace.id if trace is not None else None,
                    },
                ).dump()
            )
            return
        except (ConnectionError, TimeoutError, OSError) as exception:
            await websocket.send_json(
                DefaultResponse(
                    type="error",
                    payload={
                        "error": f"Connection error: {str(exception)}",
                        # "traceId": trace.id if trace is not None else None,
                    },
                ).dump()
            )
            return
        except Exception as exception:  # pylint: disable=broad-except
            await websocket.send_json(
                DefaultResponse(
                    type="error",
                    payload={
                        "error": f"Unexpected error: {str(exception)}",
                        # "traceId": trace.id if trace is not None else None,
                    },
                ).dump()
            )
            return
