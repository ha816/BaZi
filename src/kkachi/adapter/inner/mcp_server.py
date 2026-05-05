from __future__ import annotations

from datetime import datetime

from mcp.server.fastmcp import FastMCP

from kkachi.application.saju_service import SajuService
from kkachi.application.use_case.get_annual_fortune import AnnualFortuneInput, GetAnnualFortuneUseCase
from kkachi.application.use_case.get_basic_chart import BasicChartInput, GetBasicChartUseCase
from kkachi.application.use_case.get_saju_context import GetSajuContextUseCase, SajuContextInput
from kkachi.application.use_case.get_weather import GetWeatherUseCase

mcp = FastMCP("사주까치")

_saju_service: SajuService | None = None
_weather_uc: GetWeatherUseCase | None = None


def init_mcp_services(saju_service: SajuService, weather_port) -> None:
    global _saju_service, _weather_uc
    _saju_service = saju_service
    _weather_uc = GetWeatherUseCase(weather_port)


@mcp.tool()
async def get_saju_context(
    birth_dt: str,
    gender: str,
    year: int,
    city: str = "Seoul",
    name: str = "",
) -> str:
    """사용자의 사주 종합 정보를 반환합니다.
    성격 유형, 영역별 운세(재물·관록·학문·재능·인연)와 근거, 대운/세운 흐름,
    삼재 여부, 십이지신, 신살을 포함한 ~600자 요약입니다.
    사용자의 사주에 대한 질문에 답하기 전에 먼저 이 도구를 호출하세요.
    birth_dt 형식: 'YYYY-MM-DDTHH:MM:SS', gender: 'male' | 'female'
    """
    uc = GetSajuContextUseCase(_saju_service)
    return await uc.execute(SajuContextInput(
        birth_dt=datetime.fromisoformat(birth_dt),
        gender=gender,
        year=year,
        city=city,
        name=name,
    ))


@mcp.tool()
def get_basic_chart(
    birth_dt: str,
    gender: str,
    year: int,
    city: str = "Seoul",
) -> dict:
    """사주 기본 정보를 반환합니다. 팔자(8글자), 오행 분포, 일간, 주 오행, 올해 십이지신 관계를 포함합니다."""
    uc = GetBasicChartUseCase(_saju_service)
    return uc.execute(BasicChartInput(
        birth_dt=datetime.fromisoformat(birth_dt),
        gender=gender,
        year=year,
        city=city,
    ))


@mcp.tool()
async def get_annual_fortune(
    birth_dt: str,
    gender: str,
    year: int,
    city: str = "Seoul",
    name: str = "",
) -> dict:
    """특정 연도의 운세를 반환합니다.
    영역별 점수(재물·관록·학문·재능·인연)와 근거, 세운 간지와 십신,
    삼재 여부, 현재 대운, 세운 충·합 정보를 포함합니다.
    """
    uc = GetAnnualFortuneUseCase(_saju_service)
    return await uc.execute(AnnualFortuneInput(
        birth_dt=datetime.fromisoformat(birth_dt),
        gender=gender,
        year=year,
        city=city,
        name=name,
    ))


@mcp.tool()
async def get_weather_element(city: str = "Seoul") -> dict:
    """도시의 오늘 날씨와 오행 기운을 반환합니다.
    날씨 상태, 기온, 오행(木/火/土/金/水)을 포함합니다.
    날씨 기운이 용신에 도움이 되는지 판단할 때 사용하세요.
    """
    return await _weather_uc.execute(city)
