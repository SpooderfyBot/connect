from uuid import uuid4

import uvicorn
from fastapi import FastAPI, Response, Request
from pydantic import UUID4

app = FastAPI()


@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str) -> Response:
    response = Response(
        content="OK",
        media_type="text/plain",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )
    return response


# Add CORS headers
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


@app.get("/identify")
async def identifier(ref: UUID4 = None):
    if ref is None:
        return {
            "id": str(uuid4())
        }

    return {
        "user": {
            "name": 'ChillFish8',
            "id": '290923752475066368',
            "avatar": '4921a5665c5320be55559d1a026fca68',
            "premium": True,
        }
    }


@app.get("/identify")
async def get_identifier():
    return {
        "id": str(uuid4())
    }


@app.get("/authorize")
async def authorize(ref: UUID4):
    ...


@app.post("/revoke")
async def revoke(ref: UUID4):
    ...


if __name__ == "__main__":
    uvicorn.run("main:app")
