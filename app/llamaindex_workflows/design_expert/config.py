from email import message
from pydantic import BaseModel
from schemas.canvas import ChatCompletionRequest, DefaultResponse
from typing import Any, Dict

import dotenv
from os import path

import qdrant_client
from llama_index.core import VectorStoreIndex
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.core.llms import LLM
from llama_index.core.embeddings import BaseEmbedding
from llama_index.core.callbacks import LlamaDebugHandler, CallbackManager
from llama_index.llms.ollama import Ollama
from llama_index.llms.gemini import Gemini
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.core.embeddings.utils import EmbedType
from llama_index.core.base.base_retriever import BaseRetriever
from llama_index.core.base.base_query_engine import BaseQueryEngine
from llama_index.storage.docstore.mongodb import MongoDocumentStore
from llama_index.core.storage.storage_context import StorageContext


class DesignExpertWorkflowConfig(BaseModel):

    @staticmethod
    def init_from_request(request: ChatCompletionRequest) -> Dict[str, Any]:

        workflow_folder = path.dirname(__file__)
        env: Dict[str, Any] = dotenv.dotenv_values(workflow_folder + "/.env")

        for env_key in [
            "MODEL_ID",
            "API_KEY",
            "EMBEDDING_MODEL",
            "OLLAMA_URI",
            "VECTOR_STORAGE_URI",
            "COLLECTION_NAME",
        ]:
            if env_key not in env.keys():
                raise RuntimeError(
                    f"{env_key} not provided in workflow `.env` config [DesignExpertWorkflow]"
                )

        llm = Gemini(
            model=env.get("MODEL_ID", ""),
            api_key=env.get("API_KEY", ""),
            temperature=request.temperature or 0.1,
            max_tokens=request.max_tokens or 3600,
        )

        client = qdrant_client.QdrantClient(url=env.get("VECTOR_STORAGE_URI", ""))

        embed_model = OllamaEmbedding(
            model_name=env.get("EMBEDDING_MODEL", ""),
            base_url=env.get("OLLAMA_URI", ""),
            embed_batch_size=256,
        )

        # llama_debug = LlamaDebugHandler(print_trace_on_end=True)
        # Settings.callback_manager = CallbackManager([llama_debug])

        collection_name = (
            request.knowledge[0].id
            if request.knowledge and len(request.knowledge) > 0
            else env.get("COLLECTION_NAME", None)
        )

        if not collection_name:
            raise RuntimeError("VectoreStore collection is not provided")

        vector_store = QdrantVectorStore(client=client, collection_name=collection_name)
        index = VectorStoreIndex.from_vector_store(
            vector_store=vector_store, embed_model=embed_model
        )

        return {
            "llm": llm,
            "embedding": embed_model,
            "index": index,
        }

    @staticmethod
    def run_from_request(request: ChatCompletionRequest) -> Dict[str, Any]:
        return {
            "message": request.message,
            "chat_history": request.chat_history,
            "artifact": request.artifact,
            "highlighted_text": request.highlighted_text,
            "web_search_enabled": request.web_search_enabled,
        }
