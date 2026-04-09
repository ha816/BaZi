import tomllib
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from kkachi.adapter.inner.compatibility_controller import compatibility_router
from kkachi.adapter.inner.member_controller import member_router
from kkachi.adapter.inner.payment_controller import payment_router
from kkachi.adapter.inner.profile_controller import profile_router
from kkachi.adapter.inner.saju_controller import saju_router
from kkachi.container import Container


@asynccontextmanager
async def lifespan(app: FastAPI):
    container = Container()
    with open("src/kkachi/resource/local.toml", "rb") as f:
        container.config.from_dict(tomllib.load(f))
    app.state.container = container
    yield
    await container.db_engine().dispose()


app = FastAPI(title="사주팔자 분석 API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

app.include_router(saju_router)
app.include_router(member_router)
app.include_router(profile_router)
app.include_router(compatibility_router)
app.include_router(payment_router)
