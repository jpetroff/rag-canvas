from enum import Enum
from fastapi import Body
from fastapi.responses import JSONResponse, StreamingResponse

from server_app import app
from llama_index.core.workflow.handler import WorkflowHandler
from typing import Annotated, Any, Callable, Optional, Dict
from schemas.openai import (
    ChatCompletionChunk,
    ChatCompletionRequest,
    ChatCompletionStreamingChoice,
    ChatCompletionResponseChoice,
    ChatCompletionResponse,
    ChatMessage,
    ChoiceDelta,
    UsageInfo,
)


from workflows.design_expert_chat import (
    DesignRAGWorkflow,
    ProgressEvent,
    DesignRAGWorkflowConfig,
)


from langfuse.llama_index import LlamaIndexInstrumentor
from langfuse.llama_index._instrumentor import StatefulTraceClient


class API_OBSERVABILITY_SERVICE(str, Enum):
    LANGFUSE = "langfuse"


class OpenAIApi:

    path: str
    observability: Optional[API_OBSERVABILITY_SERVICE]
    observability_kwargs: Optional[Dict[str, Any]]

    instrumentor: Optional[LlamaIndexInstrumentor] = None

    def __init__(
        self,
        path: str,
        observability: Optional[API_OBSERVABILITY_SERVICE] = None,
        observability_kwargs: Optional[Dict[str, Any]] = None,
    ):
        self.path = path
        self.observability = observability
        self.observability_kwargs = observability_kwargs

        if self.observability and self.observability_kwargs:
            self.instrumentor = LlamaIndexInstrumentor(
                debug=False, **self.observability_kwargs
            )

        # create a websocket endpoint for our app
        @app.post(self.path)
        async def process_query(
            request: Annotated[ChatCompletionRequest, Body()],
            q: str | None = None,
        ) -> Any:
            try:
                if not request.stream:
                    return await self.generate_response(request)
                else:
                    return StreamingResponse(self.generate_streaming_response(request))
            except Exception as e:
                return JSONResponse({"type": "error", "payload": str(e)}, 500)

    async def prepare_request(self, request: ChatCompletionRequest):
        pass

    async def completion(
        self,
        request: ChatCompletionRequest,
        trace: Optional[StatefulTraceClient] = None,
    ):

        workflow_kvargs = DesignRAGWorkflowConfig.from_openai_api_request(request)
        workflow = DesignRAGWorkflow(**workflow_kvargs)
        model = request.model or ""

        # we pass it to the workflow
        handler: WorkflowHandler = workflow.run(messages=request.messages)

        # now we handle events coming back from the workflow
        async for event in handler.stream_events():
            if isinstance(event, ProgressEvent):
                yield event

        final_result = await handler

        result_index = 0

        acc_response: Dict[str, Any] = {"message": "", "metadata": {}}
        # generating first empty response with role

        init_chunk = ChatCompletionChunk(
            model=model,
            choices=[
                ChatCompletionStreamingChoice(
                    delta=ChoiceDelta(role="assistant"),
                    index=0,
                )
            ],
        )
        yield init_chunk

        for chunk in final_result["message"]:
            result_index += 1

            next_chunk = ChatCompletionChunk(
                model=model,
                choices=[
                    ChatCompletionStreamingChoice(
                        delta=ChoiceDelta(content=chunk.delta),
                        index=result_index,
                    )
                ],
            )
            acc_response["message"] += str(chunk.delta)
            yield next_chunk

        # sending final message to show that assistant output has stopped
        final_chunk = ChatCompletionChunk(
            model=model,
            choices=[
                ChatCompletionStreamingChoice(
                    delta=ChoiceDelta(), index=(result_index + 1), finish_reason="stop"
                )
            ],
        )
        if trace:
            trace.event(name="Workflow.StreamingResponse.Complete", output=acc_response)
        yield final_chunk

    async def generate_streaming_response(self, request: ChatCompletionRequest):
        if self.instrumentor:
            self.instrumentor.start()
            with self.instrumentor.observe() as trace:
                async for completion_chunk in self.completion(
                    request=request, trace=trace
                ):
                    yield completion_chunk.model_dump_json()
            self.instrumentor.stop()
        else:
            async for completion_chunk in self.completion(request=request):
                yield completion_chunk.model_dump_json()

    async def generate_response(self, request: ChatCompletionRequest):
        full_completion: str = ""

        if self.instrumentor:
            self.instrumentor.start()
            with self.instrumentor.observe() as trace:
                async for completion_chunk in self.completion(
                    request=request, trace=trace
                ):
                    if (
                        isinstance(completion_chunk, ChatCompletionChunk)
                        and completion_chunk.choices[0].delta
                    ):
                        full_completion += str(
                            completion_chunk.choices[0].delta.content
                        )
            self.instrumentor.stop()
        else:
            async for completion_chunk in self.completion(request=request):
                if (
                    isinstance(completion_chunk, ChatCompletionChunk)
                    and completion_chunk.choices[0].delta
                ):
                    full_completion += str(completion_chunk.choices[0].delta.content)

        return ChatCompletionResponse(
            model="",
            choices=[
                ChatCompletionResponseChoice(
                    index=0,
                    message=ChatMessage(role="assistant", content=str(full_completion)),
                    finish_reason="stop",
                )
            ],
            usage=UsageInfo(),
        )
