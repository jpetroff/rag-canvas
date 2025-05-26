from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import rich

rich.console = rich.console.Console(highlight=False)

app = FastAPI()

# ----------------------------------
# Add middleware
# ----------------------------------

# Enable CORS for *
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------
# Add authorization checks
# ----------------------------------
