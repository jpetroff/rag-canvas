import uvicorn
from dotenv import dotenv_values
import rich
from typing import Dict, Any, Optional

from apis.canvas import CanvasApi
from server_app import app

env = dotenv_values(".env")
env_keys = env.keys()

CanvasApi(prefix="/api/canvas")

if __name__ == "__main__":
    host = env.get("HOST") or "0.0.0.0"
    port = int(str(env.get("PORT"))) or 8080
    rich.print(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
