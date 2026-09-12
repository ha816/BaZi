import os
import tomllib
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from kkachi.adapter.inner.admin_controller import admin_router
from kkachi.adapter.inner.compatibility_controller import compatibility_router
from kkachi.adapter.inner.kkachi_controller import kkachi_router
from kkachi.adapter.inner.mcp_server import init_mcp_services
from kkachi.adapter.inner.mcp_server import mcp as mcp_server
from kkachi.adapter.inner.member_controller import member_router
from kkachi.adapter.inner.palmistry_controller import palmistry_router
from kkachi.adapter.inner.payment_controller import payment_router
from kkachi.adapter.inner.profile_controller import profile_router
from kkachi.adapter.inner.weather_controller import weather_router
from kkachi.container import Container


@asynccontextmanager
async def lifespan(app: FastAPI):
    container = Container()
    with open("src/kkachi/resource/local.toml", "rb") as f:
        container.config.from_dict(tomllib.load(f))
    if db_url := os.getenv("KKACHI_DB_URL"):
        container.config.db.url.from_value(db_url)
    app.state.container = container
    init_mcp_services(container.kkachi_service(), container.weather_adapter())
    yield
    await container.db_engine().dispose()


app = FastAPI(title="사주팔자 분석 API", lifespan=lifespan)

_cors_origins = [o.strip() for o in os.getenv("KKACHI_CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
_cors_origin_regex = os.getenv("KKACHI_CORS_ORIGIN_REGEX") or None

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_cors_origin_regex,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(kkachi_router, prefix="/kkachi")
app.include_router(member_router)
app.include_router(profile_router)
app.include_router(compatibility_router)
app.include_router(payment_router)
app.include_router(palmistry_router)
app.include_router(weather_router)
app.include_router(admin_router)
app.mount("/mcp", mcp_server.streamable_http_app())
