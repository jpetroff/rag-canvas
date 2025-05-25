import uuid
from enum import Enum
from typing import (
    Annotated,
    AsyncGenerator,
    Dict,
    Iterator,
    List,
    Literal,
    Optional,
    Union,
    Sequence,
)

from pydantic import BaseModel, Field
from llama_index.core.base.llms.types import MessageRole


def shortuuid():
    return uuid.uuid4().hex[:6]


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
