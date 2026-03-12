from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import CORS_ORIGIN
from app.core.db import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EventIQ Resource Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "resource"}
