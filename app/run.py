import uvicorn
import fastapi
from dotenv import dotenv_values
import rich
from typing import Dict, Any, Optional

env = dotenv_values(".env")
env_keys = env.keys()
from apis.canvas import CanvasApi, API_OBSERVABILITY_SERVICE
from server_app import app

"""
Init onbservability
"""
enable_observability = False
observability_kwargs: Optional[Dict[str, Any]] = None
if (
    "LANGFUSE_SECRET_KEY" in env_keys
    and "LANGFUSE_PUBLIC_KEY" in env_keys
    and "LANGFUSE_HOST" in env_keys
):
    enable_observability = True
    observability_kwargs = {
        "secret_key": env["LANGFUSE_SECRET_KEY"],
        "public_key": env["LANGFUSE_PUBLIC_KEY"],
        "host": env["LANGFUSE_HOST"],
    }

CanvasApi(
    prefix="/api/canvas",
    observability=API_OBSERVABILITY_SERVICE.LANGFUSE,
    observability_kwargs=observability_kwargs,
)

if __name__ == "__main__":
    host = env.get("HOST") or "0.0.0.0"
    port = int(str(env.get("PORT"))) or 8080
    rich.print(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
