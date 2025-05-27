"""
==============================================
    Workflow
==============================================
"""

# type: ignore[func-returns-value]

from enum import Enum
import json
from llama_index.core.workflow import (
    Event,
    StartEvent,
    StopEvent,
    Workflow,
    step,
    Context,
)
from llama_index.core.postprocessor import SimilarityPostprocessor, LongContextReorder
from llama_index.postprocessor.colbert_rerank import ColbertRerank
from llama_index.core.llms import ChatMessage, LLM
from llama_index.core.postprocessor import LongContextReorder
from llama_index.core.base.llms.types import (
    MessageRole,
    CompletionResponseGen,
    CompletionResponseAsyncGen,
)
from llama_index.core.schema import NodeWithScore
from llama_index.tools.duckduckgo import DuckDuckGoSearchToolSpec
from llama_index.core.embeddings.utils import EmbedType
from llama_index.core.schema import NodeWithScore
from llama_index.core import Settings
from llama_index.core import VectorStoreIndex
from langfuse.llama_index import LlamaIndexInstrumentor
import json_repair.json_parser
from networkx import nodes
from pydantic import BaseModel, Field, PrivateAttr
from typing import Generator, Literal, Optional, Union

from typing import List, Any, Dict

from schemas.canvas import Artifact
from libs.crawl4ai import Crawl4AiReader, string_metadata_dict

from .utils import format_nodes, last_n, log

from . import prompts


"""
Events declaration
"""


class ProgressEvent(Event):
    description: str
    content: Optional[str] = None
    isOngoing: bool = True


class DetermineContextNeeds(Event):
    pass


class GeneratePath(Event):
    nodes: List[NodeWithScore] = []
    pass


class RewriteQueryForRetrieval(Event):
    pass


class QuerySearchResults(Event):
    search_query: str


class QueryVectorIndex(Event):
    search_query: str


class PostprocessNodes(Event):
    nodes: List[NodeWithScore]
    query: str


class GenerateArtifact(Event):
    nodes: List[NodeWithScore]


class RewriteArtifact(Event):
    nodes: List[NodeWithScore]


class UpdateArtifact(Event):
    nodes: List[NodeWithScore]


class RespondToQuery(Event):
    nodes: List[NodeWithScore]


class WorkflowResult:
    async_response_gen: CompletionResponseGen
    nodes: List[NodeWithScore]

    def __init__(
        self,
        async_response_gen: CompletionResponseGen,
        nodes: List[NodeWithScore] = [],
    ):
        self.async_response_gen = async_response_gen
        self.nodes = nodes


"""
Design Expert workflow
"""


class DesignExpertWorkflow(Workflow):

    llm: LLM
    embedding: EmbedType
    index: VectorStoreIndex

    _log_defaults: Dict[str, Any] = {}

    DOCUMENTS_PER_SEARCH = 5
    SEARCH_RESULTS_TOP_K = 10

    RETRIEVE_TOP_K = 20

    POSTPROCESSING_SIMILARITY_CUTOFF = 0.7

    def __init__(
        self,
        llm: LLM,
        embedding: EmbedType,
        index: VectorStoreIndex,
        **kwargs: Any,
    ):
        super().__init__(**kwargs)
        self.llm = llm
        self.embedding = embedding
        self.index = index
        pass

    @step
    async def start(
        self, ctx: Context, ev: StartEvent
    ) -> DetermineContextNeeds | GeneratePath:
        """Parse and serialize workflow inputs. Add them to the context."""

        self._log_defaults = {"workflow": "DesignExpertWorkflow", "user": "Eugene"}

        chat_history = ev.get("chat_history", [])
        await ctx.set("chat_history", chat_history)

        original_user_message = ev.get("message", None)
        if not original_user_message:
            raise RuntimeError("Message is empty")

        await ctx.set("original_user_message", original_user_message)

        artifact: Artifact | None = ev.get("artifact", None)
        await ctx.set("artifact", artifact.content if artifact is not None else None)

        highlighted_text = ev.get("highlighted_text", None)
        await ctx.set("highlighted_text", highlighted_text)

        web_search_enabled = ev.get("web_search_enabled", False)
        await ctx.set("web_search_enabled", web_search_enabled)

        if not self.index:
            ctx.write_event_to_stream(
                ProgressEvent(
                    description="Skipping retrieval augmented generation — no index provided",
                    isOngoing=False,
                )
            )
            log("No index provided", next="GeneratePath", **self._log_defaults)
            return GeneratePath(nodes=[])
        else:
            log("", next="DetermineContextNeeds", **self._log_defaults)
            return DetermineContextNeeds()

    @step
    async def determine_context_needs(
        self, ctx: Context, ev: DetermineContextNeeds
    ) -> GeneratePath | RewriteQueryForRetrieval:

        user_query = await ctx.get("original_user_message")
        app_context = prompts.APP_CONTEXT_SNIPPET
        highlighted_text = await ctx.get("highlighted_text")
        artifact = await ctx.get("artifact")

        log(user_query, **self._log_defaults)

        # ———————————————————————————————————————————————
        # Wrapping artifact into the prompt:
        if artifact:
            artifact_snippet = prompts.ARTIFACT_SNIPPET.format(
                artifact_content=artifact
            )
        else:
            artifact_snippet = prompts.NO_ARTIFACT_SNIPPET

        # ———————————————————————————————————————————————
        # Wrapping highlighted text into the prompt:
        if highlighted_text:
            highlighted_text_snippet = prompts.HIGHLIGHTED_TEXT_SNIPPET.format(
                highlighted_text=highlighted_text
            )
        else:
            highlighted_text_snippet = prompts.NO_HIGHLIGHTED_TEXT_SNIPPET

        prompt = prompts.DETERMINE_CONTEXT_PROMPT.format(
            app_context=app_context,
            user_query=user_query,
            highlighted_text=highlighted_text_snippet,
            artifact=artifact_snippet,
        )

        response = self.llm.complete(prompt)
        verdict = response.text.strip().upper()

        ctx.write_event_to_stream(
            ProgressEvent(
                description="Analyzing need for knowledge graph query", content=verdict
            )
        )

        if verdict == "QUERY":
            log(
                f"Returned '{verdict}'",
                next="RewriteQueryForRetrieval",
                **self._log_defaults,
            )
            return RewriteQueryForRetrieval()
        elif verdict == "TASK":
            log(f"Returned '{verdict}'", next="GeneratePath", **self._log_defaults)
            return GeneratePath(nodes=[])
        else:
            log(
                f"[bold cyan]WARNING:[/] Indecisive response `{verdict}`",
                **self._log_defaults,
            )
            return RewriteQueryForRetrieval()

    @step
    async def rewrite_query_for_retrieval(
        self, ctx: Context, ev: RewriteQueryForRetrieval
    ) -> QuerySearchResults | QueryVectorIndex | None:
        user_query = await ctx.get("original_user_message", "")
        app_context = prompts.APP_CONTEXT_SNIPPET
        highlighted_text = await ctx.get("highlighted_text", "")
        artifact = await ctx.get("artifact")
        web_search_enabled: bool = await ctx.get("web_search_enabled", False)

        # ———————————————————————————————————————————————
        # Wrapping artifact into the prompt:
        if artifact:
            artifact_snippet = prompts.ARTIFACT_SNIPPET.format(
                artifact_content=artifact
            )
        else:
            artifact_snippet = prompts.NO_ARTIFACT_SNIPPET

        # ———————————————————————————————————————————————
        # Wrapping highlighted text into the prompt:
        if highlighted_text:
            highlighted_text_snippet = prompts.HIGHLIGHTED_TEXT_SNIPPET.format(
                highlighted_text=highlighted_text
            )
        else:
            highlighted_text_snippet = prompts.NO_HIGHLIGHTED_TEXT_SNIPPET

        prompt = prompts.REWRITE_FOR_RETRIEVAL_PROMPT.format(
            query=user_query,
            app_context=app_context,
            highlighted_text=highlighted_text_snippet,
            artifact=artifact_snippet,
        )

        class _NewQuery(BaseModel):
            query: str

        structured_llm = self.llm.as_structured_llm(output_cls=_NewQuery)

        response = structured_llm.complete(prompt)

        response_object: _NewQuery = _NewQuery.model_validate_json(
            json_data=response.text
        )

        log(response.text, **self._log_defaults)

        ctx.write_event_to_stream(
            ProgressEvent(
                description=f"Querying knowledge graph {'and search results' if web_search_enabled == True else ''}",
                content=str(response_object),
            )
        )

        retrieval_threads = 1
        if web_search_enabled == True:
            retrieval_threads = retrieval_threads * 2

        await ctx.set("retrieval_threads", retrieval_threads)
        await ctx.set("retrieval_threads_completed", 0)

        ctx.send_event(QueryVectorIndex(search_query=response_object.query))
        if web_search_enabled == True:
            ctx.send_event(QuerySearchResults(search_query=response_object.query))

        return None

    @step(num_workers=3)
    async def query_vector_index(
        self, ctx: Context, ev: QueryVectorIndex
    ) -> PostprocessNodes:
        """Query vector index"""
        search_query: str = ev.search_query
        original_user_query = await ctx.get("original_user_message")
        log(f"started index query for '{search_query}'", **self._log_defaults)
        result_nodes: List[NodeWithScore] = []

        try:
            log(f"query={search_query}", **self._log_defaults)
            retriever = self.index.as_retriever(similarity_top_k=self.RETRIEVE_TOP_K)
            result_nodes: List[NodeWithScore] = retriever.retrieve(search_query)
            log(
                f"returned {len(result_nodes)} nodes for '{search_query}'",
                **self._log_defaults,
            )

        except Exception as error:
            log(
                f"Exception when querying for {search_query}: {str(error)}",
                **self._log_defaults,
            )
        finally:
            retrieval_threads_completed: int = await ctx.get(
                "retrieval_threads_completed"
            )
            await ctx.set(
                "retrieval_threads_completed", retrieval_threads_completed + 1
            )
            return PostprocessNodes(nodes=result_nodes, query=ev.search_query)

    @step(num_workers=3)
    async def query_search_results(
        self, ctx: Context, ev: QuerySearchResults
    ) -> PostprocessNodes:
        """Retrieve and query search results"""
        search_query: str = ev.search_query
        original_user_query = await ctx.get("original_user_message")
        log(f"started search results query for '{search_query}'", **self._log_defaults)
        result_nodes: List[NodeWithScore] = []
        try:
            search_results = DuckDuckGoSearchToolSpec().duckduckgo_full_search(
                query=search_query, max_results=self.DOCUMENTS_PER_SEARCH
            )
            crawl_reader = Crawl4AiReader()
            documents = await crawl_reader.read_markdown_documents(
                urls=[source["href"] for source in search_results]
            )
            log(f"crawled {len(documents)} documents", **self._log_defaults)
            index = VectorStoreIndex.from_documents(
                documents, show_progress=False, embed_model=self.embedding
            )
            retriever = index.as_retriever(
                verbose=False, similarity_top_k=self.SEARCH_RESULTS_TOP_K
            )
            result_nodes: List[NodeWithScore] = retriever.retrieve(original_user_query)
            log(f"dispatched {len(result_nodes)} nodes", **self._log_defaults)

        except Exception as error:
            log(
                f"Exception when querying for {search_query}: {str(error)}",
                **self._log_defaults,
            )
        finally:
            retrieval_threads_completed: int = await ctx.get(
                "retrieval_threads_completed"
            )
            await ctx.set(
                "retrieval_threads_completed", retrieval_threads_completed + 1
            )
            return PostprocessNodes(nodes=result_nodes, query=ev.search_query)

    @step
    async def postprocess_nodes(
        self, ctx: Context, ev: PostprocessNodes
    ) -> GeneratePath | None:
        """Node postprocessing: similarity cutoff and long context reorder. Optionally: add reranking"""

        retrieval_threads: int = await ctx.get("retrieval_threads")
        retrieval_threads_completed: int = await ctx.get("retrieval_threads_completed")
        event_results = ctx.collect_events(ev, [PostprocessNodes] * retrieval_threads)

        if event_results is None:
            log(
                f"Awaiting queries: {retrieval_threads_completed if retrieval_threads_completed is not None else 0} of {retrieval_threads}",
                **self._log_defaults,
            )
            return None

        all_nodes: List[NodeWithScore] = []
        for event in event_results:
            all_nodes += event.nodes

        log(
            f"Postprocessing started, total nodes: {len(all_nodes)}",
            **self._log_defaults,
        )

        retrieval_query = ev.query
        original_user_query = await ctx.get("original_user_message")

        similarity_cutoff_postprocessor = SimilarityPostprocessor(
            similarity_cutoff=self.POSTPROCESSING_SIMILARITY_CUTOFF
        )
        nodes_cutoff = similarity_cutoff_postprocessor.postprocess_nodes(all_nodes)

        long_context_reorder_postprocessor = LongContextReorder()
        nodes_reordered = long_context_reorder_postprocessor.postprocess_nodes(
            nodes_cutoff
        )

        log(
            f"Postprocessing ended: {len(nodes_reordered)}/{len(all_nodes)} returned",
            **self._log_defaults,
        )

        return GeneratePath(nodes=nodes_reordered)

    @step
    async def generate_path(
        self, ctx: Context, ev: GeneratePath
    ) -> GenerateArtifact | UpdateArtifact | RewriteArtifact | RespondToQuery:
        user_query = await ctx.get("original_user_message")
        app_context = prompts.APP_CONTEXT_SNIPPET
        artifact = await ctx.get("artifact")
        highlighted_text = await ctx.get("highlighted_text")
        chat_history: List[Any] = await ctx.get("chat_history")

        # @TODO: Update artifact:
        if highlighted_text:
            ctx.send_event(UpdateArtifact(nodes=ev.nodes))

        if len(chat_history):
            recent_messages_acc: str = ""
            for message in last_n(chat_history, 3):
                recent_messages_acc += str(message)
            recent_messages_snippet = prompts.RECENT_MESSAGES_SNIPPET.format(
                recent_mesages=recent_messages_acc
            )
        else:
            recent_messages_snippet = prompts.NO_RECENT_MESSAGES

        if artifact:
            artifact_snipet = prompts.ARTIFACT_SNIPPET.format(artifact=artifact)
            route_options_snippet = prompts.HAS_ARTIFACT_ROUTES
        else:
            artifact_snipet = prompts.NO_ARTIFACT_SNIPPET
            route_options_snippet = prompts.NO_ARTIFACT_ROUTES

        prompt = prompts.GENERATE_PATH_PROMPT.format(
            app_context=app_context,
            artifact=artifact_snipet,
            recent_messages=recent_messages_snippet,
            route_options=route_options_snippet,
            user_query=user_query,
        )

        class _Route(str, Enum):
            generateArtifact = "generateArtifact"
            replyToGeneralInput = "replyToGeneralInput"
            rewriteArtifact = "rewriteArtifact"

        class _RouteCompletion(BaseModel):
            route: _Route

        structured_llm = self.llm.as_structured_llm(output_cls=_RouteCompletion)

        response = structured_llm.complete(prompt)

        response_object: _RouteCompletion = _RouteCompletion.model_validate_json(
            json_data=response.text
        )

        log(response.text, **self._log_defaults)

        if response_object.route == "generateArtifact":
            log(f"", next="GenerateArtifact", **self._log_defaults)
            return GenerateArtifact(nodes=ev.nodes)

        elif response_object.route == "rewriteArtifact":
            log(f"", next="RewriteArtifact", **self._log_defaults)
            return RewriteArtifact(nodes=ev.nodes)

        elif response_object.route == "replyToGeneralInput":
            log(f"", next="RespondToQuery", **self._log_defaults)
            return RespondToQuery(nodes=ev.nodes)

        else:
            log(
                f"[orange]WARNING:[/] Indecisive output",
                next="GenerateArtifact",
                **self._log_defaults,
            )
            return GenerateArtifact(nodes=ev.nodes)

    @step
    async def generate_artifact(self, ctx: Context, ev: GenerateArtifact) -> StopEvent:
        user_query = await ctx.get("original_user_message")
        app_context = prompts.APP_CONTEXT_SNIPPET
        highlighted_text = await ctx.get("highlighted_text")
        artifact = await ctx.get("artifact")

        formatted_context_list = format_nodes(ev.nodes)
        reference_snippet = prompts.RETRIEVED_CONTEXT_SNIPPET.format(
            retrieved_context=formatted_context_list
        )

        prompt = prompts.GENERATE_ARTIFACT_PROMPT.format(
            app_context=app_context,
            retrieved_context_snippet=reference_snippet,
            user_query=user_query,
        )

        log(f"Generating new artifact", **self._log_defaults)

        response_gen = self.llm.stream_complete(prompt=prompt)

        return StopEvent(
            WorkflowResult(async_response_gen=response_gen, nodes=ev.nodes)
        )

    @step
    async def update_artifact(self, ctx: Context, ev: UpdateArtifact) -> StopEvent:
        user_query = await ctx.get("original_user_message")
        app_context = prompts.APP_CONTEXT_SNIPPET
        highlighted_text = await ctx.get("highlighted_text")
        artifact = await ctx.get("artifact")

        formatted_context_list = format_nodes(ev.nodes)
        reference_snippet = prompts.RETRIEVED_CONTEXT_SNIPPET.format(
            retrieved_context=formatted_context_list
        )

        prompt = prompts.UPDATE_ARTIFACT_PROMPT.format(
            retrieved_context_snippet=reference_snippet,
            artifact=artifact,
            user_query=user_query,
            highlighted_text=highlighted_text,
        )

        log(f"Updating existing artifact", **self._log_defaults)
        response_gen = self.llm.stream_complete(prompt=prompt)

        return StopEvent(
            WorkflowResult(async_response_gen=response_gen, nodes=ev.nodes)
        )

    @step
    async def rewrite_artifact(self, ctx: Context, ev: RewriteArtifact) -> StopEvent:
        user_query = await ctx.get("original_user_message")
        app_context = prompts.APP_CONTEXT_SNIPPET
        artifact = await ctx.get("artifact")

        formatted_context_list = format_nodes(ev.nodes)
        reference_snippet = prompts.RETRIEVED_CONTEXT_SNIPPET.format(
            retrieved_context=formatted_context_list
        )

        prompt = prompts.REWRITE_ARTIFACT_PROMPT.format(
            app_context=app_context,
            retrieved_context_snippet=reference_snippet,
            artifact=artifact,
            user_query=user_query,
        )

        log(f"Generating new artifact", **self._log_defaults)

        response_gen = self.llm.stream_complete(prompt=prompt)

        return StopEvent(
            WorkflowResult(async_response_gen=response_gen, nodes=ev.nodes)
        )

    @step
    async def respond_to_query(self, ctx: Context, ev: RespondToQuery) -> StopEvent:
        app_context = prompts.APP_CONTEXT_SNIPPET
        user_query = await ctx.get("original_user_message")
        chat_history = await ctx.get("chat_history")

        formatted_context_list = format_nodes(ev.nodes)
        reference_snippet = prompts.RETRIEVED_CONTEXT_SNIPPET.format(
            retrieved_context=formatted_context_list
        )

        if len(chat_history):
            recent_messages_acc: str = ""
            for message in last_n(chat_history, 3):
                recent_messages_acc += str(message)
            recent_messages_snippet = prompts.RECENT_MESSAGES_SNIPPET.format(
                recent_mesages=recent_messages_acc
            )
        else:
            recent_messages_snippet = prompts.NO_RECENT_MESSAGES

        prompt = prompts.RESPOND_TO_QUERY_PROMPT.format(
            app_context=app_context,
            user_query=user_query,
            retrieval_context_snippet=formatted_context_list,
            recent_messages=recent_messages_snippet,
        )

        response_gen = self.llm.stream_complete(prompt=prompt)

        return StopEvent(
            WorkflowResult(async_response_gen=response_gen, nodes=ev.nodes)
        )
