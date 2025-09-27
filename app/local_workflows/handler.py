"""
WorkflowHandler - A wrapper around LlamaIndex workflows for easier handling
"""

from typing import Any, AsyncGenerator, Dict, Optional
from llama_index.core.workflow import Workflow, Event
import asyncio


class WorkflowHandler:
    """
    A handler that wraps LlamaIndex workflows to provide a consistent interface
    for running workflows and streaming events.
    """

    def __init__(self, workflow: Workflow, **kwargs):
        self.workflow = workflow
        self.kwargs = kwargs
        self._result: Optional[Any] = None
        self._events: list = []

    def run(self, **kwargs) -> "WorkflowHandler":
        """
        Run the workflow with the given parameters.
        Returns self for method chaining.
        """
        self.kwargs.update(kwargs)
        return self

    async def stream_events(self) -> AsyncGenerator[Event, None]:
        """
        Stream events from the workflow execution.
        """
        if hasattr(self.workflow, "arun"):
            # For async workflows
            async for event in self.workflow.arun(**self.kwargs):
                if isinstance(event, Event):
                    self._events.append(event)
                    yield event
        else:
            # For sync workflows, run in executor
            loop = asyncio.get_event_loop()
            for event in await loop.run_in_executor(None, self.workflow.run, **self.kwargs):
                if isinstance(event, Event):
                    self._events.append(event)
                    yield event

    async def __await__(self) -> Any:
        """
        Await the workflow result.
        """
        if self._result is None:
            if hasattr(self.workflow, "arun"):
                # For async workflows
                result = await self.workflow.arun(**self.kwargs)
            else:
                # For sync workflows, run in executor
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, self.workflow.run, **self.kwargs)

            self._result = result

        return self._result

    def __aiter__(self):
        """Make the handler async iterable for streaming events."""
        return self.stream_events()

    def __iter__(self):
        """Make the handler iterable for sync event streaming."""
        if hasattr(self.workflow, "run"):
            for event in self.workflow.run(**self.kwargs):
                if isinstance(event, Event):
                    self._events.append(event)
                    yield event
        return iter(self._events)
