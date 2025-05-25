# Taken from https://github.com/Lightning-AI/LitServe/blob/main/src/litserve/specs/openai.py
#

import asyncio
import inspect
import json
import logging
import time
import typing
import uuid
from collections import deque
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
)

from fastapi import BackgroundTasks, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


def shortuuid():
    return uuid.uuid4().hex[:6]


class UsageInfo(BaseModel):
    prompt_tokens: int = 0
    total_tokens: int = 0
    completion_tokens: Optional[int] = 0

    def __add__(self, other: "UsageInfo") -> "UsageInfo":
        other.prompt_tokens += self.prompt_tokens
        other.total_tokens += self.total_tokens
        if other.completion_tokens is not None:
            other.completion_tokens += int(
                self.completion_tokens if self.completion_tokens is not None else 0
            )
        return other

    def __radd__(self, other):
        if other == 0:
            return self
        return self.__add__(other)


class TextContent(BaseModel):
    type: str
    text: str


class ImageDetail(str, Enum):
    auto = "auto"
    low = "low"
    high = "high"


class ImageContentURL(BaseModel):
    url: str
    detail: ImageDetail = ImageDetail.auto


class ImageContent(BaseModel):
    type: str
    image_url: Union[str, ImageContentURL]


class InputAudio(BaseModel):
    data: str  # base64 encoded audio data.
    format: Literal["wav", "mp3"]


class AudioContent(BaseModel):
    type: Literal["input_audio"]
    input_audio: InputAudio


class Function(BaseModel):
    name: str
    description: str
    parameters: Dict[str, object]


class ToolChoice(str, Enum):
    auto = "auto"
    none = "none"
    any = "any"


class Tool(BaseModel):
    type: Literal["function"]
    function: Function


class FunctionCall(BaseModel):
    name: str
    arguments: str


class ToolCall(BaseModel):
    index: int = 0
    id: Optional[str] = None
    type: str = "function"
    function: FunctionCall


class ResponseFormatText(BaseModel):
    type: Literal["text"]


class ResponseFormatJSONObject(BaseModel):
    type: Literal["json_object"]


class JSONSchema(BaseModel):
    name: str
    description: Optional[str] = None
    schema_: Optional[Dict[str, object]] = Field(None, alias="schema")
    strict: Optional[bool] = False


class ResponseFormatJSONSchema(BaseModel):
    json_schema: JSONSchema
    type: Literal["json_schema"]


ResponseFormat = Annotated[
    Union[ResponseFormatText, ResponseFormatJSONObject, ResponseFormatJSONSchema],
    "ResponseFormat",
]


class ChatMessage(BaseModel):
    role: str
    content: Optional[
        Union[str, List[Union[TextContent, ImageContent, AudioContent]]]
    ] = None
    name: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = None
    tool_call_id: Optional[str] = None


class ChatMessageWithUsage(ChatMessage):
    prompt_tokens: Optional[int] = 0
    total_tokens: Optional[int] = 0
    completion_tokens: Optional[int] = 0


class ChoiceDelta(ChatMessage):
    content: Optional[
        Union[str, List[Union[TextContent, ImageContent, AudioContent]]]
    ] = None
    role: Optional[Literal["system", "user", "assistant", "tool"]] = None  # type: ignore


class ChatCompletionRequest(BaseModel):
    model: Optional[str] = ""
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 1.0
    n: Optional[int] = 1
    max_tokens: Optional[int] = None  # Kept for backward compatibility
    max_completion_tokens: Optional[int] = None
    stop: Optional[Union[str, List[str]]] = None
    stream: Optional[bool] = False
    presence_penalty: Optional[float] = 0.0
    frequency_penalty: Optional[float] = 0.0
    user: Optional[str] = None
    tools: Optional[List[Tool]] = None
    tool_choice: Optional[ToolChoice] = ToolChoice.auto
    response_format: Optional[ResponseFormat] = None
    metadata: Optional[Dict[str, str]] = None


class ChatCompletionResponseChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: Optional[Literal["stop", "length"]]


class ChatCompletionResponse(BaseModel):
    id: str = Field(default_factory=lambda: f"chatcmpl-{shortuuid()}")
    object: str = "chat.completion"
    created: int = Field(default_factory=lambda: int(time.time()))
    model: str
    choices: List[ChatCompletionResponseChoice]
    usage: UsageInfo


class ChatCompletionStreamingChoice(BaseModel):
    delta: Optional[ChoiceDelta]
    finish_reason: Optional[
        Literal["stop", "length", "tool_calls", "content_filter", "function_call"]
    ] = None
    index: int
    logprobs: Optional[dict] = None


class ChatCompletionChunk(BaseModel):
    id: str = Field(default_factory=lambda: f"chatcmpl-{shortuuid()}")
    object: str = "chat.completion.chunk"
    created: int = Field(default_factory=lambda: int(time.time()))
    model: str
    system_fingerprint: Optional[str] = None
    choices: List[ChatCompletionStreamingChoice] = []
    usage: Optional[UsageInfo] = None


class ProgressResponse(BaseModel):
    pass
