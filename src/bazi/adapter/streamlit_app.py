"""사주팔자 분석 Streamlit UI"""

import datetime

import streamlit as st

from bazi.application.natal import NatalAnalyzer, PostnatalAnalyzer
from bazi.application.interpret import Interpreter
from bazi.domain.natal import Saju
from bazi.domain.user import Gender, User
from bazi.domain.util import year_to_ganji

OHENG_EMOJI = {"木": "🌳", "火": "🔥", "土": "⛰️", "金": "🪙", "水": "💧"}

analyze_natal = NatalAnalyzer()
analyze_postnatal = PostnatalAnalyzer()
interpret = Interpreter()


def main():
    st.set_page_config(page_title="사주팔자 분석", page_icon="🔮", layout="centered")
    st.title("사주팔자 분석기")

    # ── 입력 폼 ──
    with st.form("saju_form"):
        col1, col2 = st.columns(2)
        with col1:
            birth_date = st.date_input(
                "생년월일",
                value=datetime.date(1990, 1, 1),
                min_value=datetime.date(1920, 1, 1),
                max_value=datetime.date.today(),
            )
        with col2:
            birth_time = st.time_input("태어난 시각", value=datetime.time(12, 0))

        col3, col4 = st.columns(2)
        with col3:
            gender = st.selectbox("성별", ["남성", "여성"])
        with col4:
            analysis_year = st.number_input(
                "분석 연도", min_value=1920, max_value=2100,
                value=datetime.date.today().year,
            )

        submitted = st.form_submit_button("분석하기", use_container_width=True)

    if not submitted:
        return

    # ── 분석 실행 ──
    birth_dt = datetime.datetime(
        birth_date.year, birth_date.month, birth_date.day,
        birth_time.hour, birth_time.minute,
    )
    user = User(
        name="",
        gender=Gender.MALE if gender == "남성" else Gender.FEMALE,
        birth_dt=birth_dt,
    )

    try:
        dt = user.birth_dt
        saju = Saju(dt.year, dt.month, dt.day, dt.hour, dt.minute, city=user.city)
        natal = analyze_natal(saju)
        postnatal = analyze_postnatal(user, natal, year=analysis_year)
        summary = interpret(natal, postnatal)
    except Exception as e:
        st.error(f"분석 중 오류가 발생했습니다: {e}")
        return

    # ── 사주 원국 ──
    st.header("사주 원국")

    pillar_labels = ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"]
    cols = st.columns(4)
    for col, label, pillar in zip(cols, pillar_labels, natal.saju.pillars):
        with col:
            st.metric(label=label, value=pillar)

    # ── 오행 분포 ──
    st.subheader("오행 분포")
    oheng_cols = st.columns(5)
    for col, (element, count) in zip(oheng_cols, natal.element_stats.items()):
        with col:
            emoji = OHENG_EMOJI.get(element.name, "")
            st.metric(label=f"{emoji} {element.name}", value=f"{count}개")

    # ── 강약·용신 ──
    col_a, col_b, col_c = st.columns(3)
    with col_a:
        me = natal.my_main_element
        st.metric("일간 오행", f"{OHENG_EMOJI.get(me.name, '')} {me.name}")
    with col_b:
        if natal.strength > 0:
            strength_label = "신강(身強)"
        elif natal.strength < 0:
            strength_label = "신약(身弱)"
        else:
            strength_label = "중화(中和)"
        st.metric("강약", f"{strength_label} ({natal.strength:+d})")
    with col_c:
        yong = natal.yongshin
        st.metric("용신(用神)", f"{OHENG_EMOJI.get(yong.name, '')} {yong.name}")

    # ── 성격 ──
    st.subheader("기본 성격")
    st.info(natal.personality)

    # ── 십신 분석 ──
    st.subheader("십신 분석")
    for char, s in natal.sipsin:
        st.write(f"**{char}** → {s.name} : {s.domain}")

    # ── 세운 ──
    st.header(f"{analysis_year}년 세운")
    st.write(f"세운 간지: **{year_to_ganji(analysis_year)}**")

    if postnatal.yongshin_in_seun:
        st.success(f"세운에 용신({yong.name})이 포함되어 있습니다.")
    else:
        st.warning(f"세운에 용신({yong.name})이 없습니다.")

    for char, s in [postnatal.seun_stem, postnatal.seun_branch]:
        st.write(f"**{char}**({s.name}): {s.domain}")

    # ── 대운 ──
    st.header("대운 흐름")

    if postnatal.current_daeun:
        daeun = postnatal.current_daeun
        st.write(f"현재 대운: **{daeun.ganji}** ({daeun.start_age}~{daeun.end_age}세)")

        if postnatal.yongshin_in_daeun:
            st.success(f"대운에 용신({yong.name})이 포함되어 있습니다.")
        else:
            st.warning(f"대운에 용신({yong.name})이 없습니다.")

        for char, s in postnatal.daeun_sipsin:
            st.write(f"**{char}**({s.name}): {s.domain}")

    # 대운 전체 타임라인
    st.subheader("대운 타임라인")
    for d in postnatal.daeun:
        marker = " ← 현재" if postnatal.current_daeun and d.ganji == postnatal.current_daeun.ganji else ""
        st.write(f"**{d.ganji}** ({d.start_age}~{d.end_age}세){marker}")

    # ── 충·합 ──
    if postnatal.seun_clashes or postnatal.daeun_clashes:
        st.subheader("충(衝) 감지")
        for clash in postnatal.seun_clashes + postnatal.daeun_clashes:
            st.error(f"{clash['incoming']} ↔ {clash['target']} ({clash['pillar']})")

    if postnatal.seun_combines or postnatal.daeun_combines:
        st.subheader("합(合) 감지")
        for combine in postnatal.seun_combines + postnatal.daeun_combines:
            st.success(f"{combine['incoming']} ↔ {combine['target']} ({combine['pillar']}, {combine['type']})")

    # ── 종합 해석 ──
    st.header("종합 해석")
    for line in summary:
        st.write(line)


if __name__ == "__main__":
    main()