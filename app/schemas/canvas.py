import uuid
from enum import Enum
from typing import (
    Any,
    List,
    Literal,
    Optional,
    Union,
    Sequence,
)

from pydantic import BaseModel, Field
from llama_index.core.base.llms.types import MessageRole


def shortuuid():
    return uuid.uuid4().hex[:12]


class DefaultResponse(BaseModel):
    type: Union[
        Literal["error"],
        Literal["completion.response"],
        Literal["completion.chunk"],
        Literal["completion.usage"],
        Literal["completion.sources"],
        Literal["completion.hitl.request"],  # Human-In-The-Loop request
        Literal["event"],
        Literal["confirmation"],
        str,
    ] = Field()
    payload: Optional[Any] = Field(default=None)  # Any JSON-serializable value
    content: Optional[Union[str, float, int]] = Field(default=None)

    def dump(self):
        return super().model_dump(exclude_unset=True)


class TextHighlight(BaseModel):
    content: str = Field()
    type: Literal["code", "markdown", "plain"] = Field(default="markdown")


class Artifact(BaseModel):
    id: str = Field(default_factory=lambda: "artifact-" + shortuuid())
    content: str = Field()


class KnowledgeGraphOrStorage(BaseModel):
    type: Union[Literal["VectorStore"], Literal["DocumentStore"]] = Field(
        default="VectorStore"
    )
    id: str = Field()
    client: Union[Literal["qdrant"], Literal["mongodb"], str] = Field()


class ChatMessageBase(BaseModel):
    role: MessageRole = Field()
    content: str = Field()


class ChatCompletionRequest(BaseModel):
    message: str = Field()

    chat_history: Sequence[ChatMessageBase] = Field(validation_alias="chatHistory")

    knowledge: List[KnowledgeGraphOrStorage] = Field()

    model_id: Union[Literal["default"], str] = Field(
        default="default", validation_alias="modelId"
    )

    embed_model_id: Union[Literal["default"], str] = Field(
        default="default", validation_alias="embedModelId"
    )

    workflow_id: Union[Literal["default"], str] = Field(
        default="default", validation_alias="workflowId"
    )

    highlighted_text: Optional[TextHighlight] = Field(
        default=None,
        description="Highlighted text attached to the message",
        validation_alias="highlightedText",
    )

    artifact: Optional[Artifact] = Field(
        default=None, description="Last artifact within the context of conversation"
    )

    artifact_length: Optional[
        Union[Literal["short"], Literal["medium"], Literal["long"]]
    ] = Field(
        default="short",
        description="Proposed artifact length",
        validation_alias="artifactLength",
    )

    add_comments: Optional[bool] = Field(default=False, validation_alias="addComments")

    add_logs: Optional[bool] = Field(default=False, validation_alias="addLogs")

    fix_bugs: Optional[bool] = Field(default=False, validation_alias="fixBugs")

    web_search_enabled: Optional[bool] = Field(
        default=True, validation_alias="webSearchEnabled"
    )

    stream: Optional[bool] = Field(default=True)

    temperature: Optional[float] = Field(default=0.1)

    max_tokens: Optional[int] = Field(default=1024 * 5, validation_alias="maxTokens")

    similarity_cutoff: Optional[float] = Field(
        default=0.7, validation_alias="similarityCutoff"
    )
