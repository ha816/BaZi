from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bazi.adapter.controller import router

app = FastAPI(title="사주팔자 분석 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

app.include_router(router)
