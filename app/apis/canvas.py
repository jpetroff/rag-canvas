from email.policy import default
from enum import Enum
from fastapi import Body, WebSocket
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, SerializeAsAny
from typing import (
    Annotated,
    Any,
    Callable,
    Optional,
    Dict,
    Literal,
    Union,
    List,
    TypedDict,
)
from typing_extensions import NotRequired, TypedDict
import os

from schemas.openai import ChatCompletionResponse, shortuuid
from workflows.design_expert.workflow import WorkflowResult
from server_app import app
from llama_index.core.workflow.handler import WorkflowHandler
from schemas.canvas import ChatCompletionRequest, DefaultResponse

from workflows.design_expert import (
    DesignExpertWorkflow,
    ProgressEvent,
    DesignExpertWorkflowConfig,
)

from openinference.instrumentation.llama_index import LlamaIndexInstrumentor
from langfuse import get_client, Langfuse
from langfuse._client.span import LangfuseSpan
import logging


class API_OBSERVABILITY_SERVICE(str, Enum):
    LANGFUSE = "langfuse"


class CanvasApi:

    prefix: str = ""
    ws_completion_endpoint: str = "completion"

    get_workflows_endpoint: str = "workflows"
    observability: Optional[API_OBSERVABILITY_SERVICE]
    observability_kwargs: Optional[Dict[str, Any]]

    instrumentor: Optional[LlamaIndexInstrumentor] = None
    langfuse: Optional[Langfuse] = None

    def __init__(
        self,
        prefix: str,
        observability: Optional[API_OBSERVABILITY_SERVICE] = None,
        observability_kwargs: Optional[Dict[str, Any]] = None,
    ):
        self.prefix = prefix
        self.observability = observability
        self.observability_kwargs = observability_kwargs

        if self.observability and self.observability_kwargs:
            os.environ["LANGFUSE_PUBLIC_KEY"] = self.observability_kwargs["public_key"]
            os.environ["LANGFUSE_SECRET_KEY"] = self.observability_kwargs["secret_key"]
            os.environ["LANGFUSE_HOST"] = self.observability_kwargs["host"]
            self.langfuse = get_client()
            # Verify connection
            if self.langfuse.auth_check():
                print("Langfuse client is authenticated and ready!")
            else:
                print("Authentication failed. Please check your credentials and host.")

            self.instrumentor = LlamaIndexInstrumentor(**self.observability_kwargs)
            self.instrumentor.instrument()
            langfuse_logger = logging.getLogger("langfuse")
            langfuse_logger.setLevel("CRITICAL")

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
        except Exception as error:
            response = DefaultResponse(type="error", content=str(error))
            await websocket.send_json(response.dump())
        finally:
            if (
                self.instrumentor
                and self.langfuse
                and self.instrumentor.is_instrumented_by_opentelemetry
            ):
                self.langfuse.flush()
            await websocket.close()

    async def start_with_observability(self, websocket: WebSocket):
        assert self.instrumentor
        assert self.langfuse

        with self.langfuse.start_as_current_span(
            name=f"workflow-{shortuuid()}"
        ) as trace:
            await self.completion(websocket, trace)
        self.langfuse.flush()

    async def completion(
        self, websocket: WebSocket, trace: Optional[LangfuseSpan] = None
    ):
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
                        DefaultResponse(
                            type="event", payload=event.model_dump()
                        ).model_dump()
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
                        "traceId": trace.trace_id if trace is not None else None,
                    },
                ).model_dump()
            )

            if trace:
                trace.create_event(
                    name="Generation.Complete", output=accumulated_response
                )

        except Exception as exception:
            await websocket.send_json(
                DefaultResponse(
                    type="error",
                    payload={
                        "error": str(exception),
                        "traceId": trace.id if trace is not None else None,
                    },
                ).dump()
            )
            return
