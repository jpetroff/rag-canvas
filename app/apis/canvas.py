from enum import Enum
from fastapi import Body, WebSocket
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, SerializeAsAny
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

from server_app import app
from llama_index.core.workflow.handler import WorkflowHandler
from schemas.canvas import (
    ChatCompletionRequest,
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


class DefaultResponse(BaseModel):
    type: Union[
        Literal["error"],
        Literal["completion"],
        Literal["completion.chunk"],
        Literal["event"],
        Literal["confirmation"],
        str,
    ]
    payload: Any  # Any JSON-serializable value

    def __str__(self):
        return self.model_dump_json()


class CanvasApi:

    prefix: str = ""
    ws_completion_endpoint: str = "completion"
    get_models_endpoint: str = "models"
    get_workflows_endpoint: str = "workflows"
    get_knowledge_endpoint: str = "storage"
    observability: Optional[API_OBSERVABILITY_SERVICE]
    observability_kwargs: Optional[Dict[str, Any]]

    instrumentor: Optional[LlamaIndexInstrumentor] = None

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
            self.instrumentor = LlamaIndexInstrumentor(
                debug=False, **self.observability_kwargs
            )

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
            response = DefaultResponse(type="error", payload=str(error))
            await websocket.send_json(response.model_dump())
        finally:
            await websocket.close()

    async def start_with_observability(self, websocket: WebSocket):
        # @TODO: add Langfuse context wrapper
        await self.completion(websocket)

    async def completion(
        self, websocket: WebSocket, trace: Optional[StatefulTraceClient] = None
    ):
        try:

            request = await websocket.receive_json()
            chatCompletionrequest = ChatCompletionRequest.model_validate(request)
            await websocket.send_json(
                DefaultResponse(
                    type="confirmation", payload="Starting workflow"
                ).model_dump()
            )

        except Exception as exception:
            await websocket.send_json(
                DefaultResponse(
                    type="error",
                    payload={
                        "error": str(exception),
                        "traceId": trace.id if trace is not None else None,
                        "traceUrl": (
                            trace.get_trace_url() if trace is not None else None
                        ),
                    },
                ).model_dump()
            )
            return
