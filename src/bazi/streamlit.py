import datetime

import plotly.graph_objects as go
import streamlit as st

from bazi.application.constant import DOMAIN_MAP
from bazi.adapter.outer.natal_adapter import NatalAdapter, PostnatalAdapter
from bazi.application.saju_service import SajuService
from bazi.application.util.util import year_to_ganji
from bazi.domain.ganji import Stem, Branch
from bazi.domain.user import Gender, User

_OHENG_EMOJI: dict[str, str] = {"木": "🌳", "火": "🔥", "土": "⛰️", "金": "🪙", "水": "💧"}

analyze_natal = NatalAdapter()
analyze_postnatal = PostnatalAdapter()
saju_service = SajuService(natal_port=analyze_natal, postnatal_port=analyze_postnatal)


def main():
    st.set_page_config(page_title="사주팔자 분석", page_icon="🔮", layout="centered")
    st.title("사주팔자 분석기")

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
            gender = st.selectbox("성별", ["남성", "여성"], format_func=lambda x: x)
        with col4:
            analysis_year = st.number_input(
                "분석 연도", min_value=1920, max_value=2100,
                value=datetime.date.today().year,
            )

        submitted = st.form_submit_button("분석하기", width="stretch")

    if not submitted:
        return

    birth_dt = datetime.datetime(
        birth_date.year, birth_date.month, birth_date.day,
        birth_time.hour, birth_time.minute,
    )
    user = User(
        name="",
        gender=Gender.MALE if gender == "남성" else Gender.FEMALE,  # UI는 한글, Gender enum은 영문
        birth_dt=birth_dt,
    )

    try:
        natal = analyze_natal.analyze(user)
        postnatal = analyze_postnatal.analyze(user, natal, year=analysis_year)
        summary = saju_service.interpret(natal, postnatal)
    except Exception as e:
        st.error(f"분석 중 오류가 발생했습니다: {e}")
        return

    st.header("사주 원국")

    pillar_labels = ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"]
    cols = st.columns(4)
    for col, label, pillar in zip(cols, pillar_labels, natal.saju.pillars.values()):
        with col:
            st.metric(label=label, value=str(pillar))

    st.subheader("오행 분포")
    oheng_cols = st.columns(5)
    for col, (element, count) in zip(oheng_cols, natal.element_stats.items()):
        with col:
            emoji = _OHENG_EMOJI.get(element.name, "")
            st.metric(label=f"{emoji} {element.name}", value=f"{count}개")

    oheng_names = [f"{_OHENG_EMOJI.get(o.name, '')} {o.name}" for o in natal.element_stats]
    oheng_values = list(natal.element_stats.values())

    fig_radar = go.Figure()
    fig_radar.add_trace(go.Scatterpolar(
        r=oheng_values + [oheng_values[0]],
        theta=oheng_names + [oheng_names[0]],
        fill="toself",
        fillcolor="rgba(99, 110, 250, 0.2)",
        line=dict(color="#636EFA", width=2),
        name="오행 분포",
    ))
    fig_radar.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0, max(oheng_values) + 1], tickmode="linear", dtick=1),
        ),
        showlegend=False,
        height=350,
        margin=dict(l=60, r=60, t=30, b=30),
    )
    st.plotly_chart(fig_radar, width="stretch")

    col_a, col_b, col_c = st.columns(3)
    with col_a:
        me = natal.my_main_element
        st.metric("일간 오행", f"{_OHENG_EMOJI.get(me.name, '')} {me.name}")
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
        st.metric("용신(用神)", f"{_OHENG_EMOJI.get(yong.name, '')} {yong.name}")

    st.subheader("기본 성격")
    st.info(natal.personality)

    st.subheader("십신 분석")
    for char, s in natal.sipsin:
        st.write(f"**{char}** → {s.name} : {s.domain}")

    st.header(f"{analysis_year}년 세운")
    st.write(f"세운 간지: **{year_to_ganji(analysis_year)}**")

    if postnatal.yongshin_in_seun:
        st.success(f"세운에 용신({yong.name})이 포함되어 있습니다.")
    else:
        st.warning(f"세운에 용신({yong.name})이 없습니다.")

    for char, s in [postnatal.seun_stem, postnatal.seun_branch]:
        st.write(f"**{char}**({s.name}): {s.domain}")

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

    st.subheader("대운 타임라인")

    daeun_labels = []
    daeun_scores = []
    daeun_colors = []
    for d in postnatal.daeun:
        daeun_labels.append(f"{d.ganji}\n({d.start_age}~{d.end_age}세)")
        has_yongshin = natal.yongshin in (
            Stem.from_char(d.ganji[0]).element, Branch.from_char(d.ganji[1]).element
        )
        is_current = postnatal.current_daeun and d.ganji == postnatal.current_daeun.ganji
        score = 2 if has_yongshin else 0
        daeun_scores.append(score)
        if is_current:
            daeun_colors.append("#FF6B6B")
        elif has_yongshin:
            daeun_colors.append("#4CAF50")
        else:
            daeun_colors.append("#B0BEC5")

    fig_timeline = go.Figure()
    fig_timeline.add_trace(go.Scatter(
        x=daeun_labels, y=daeun_scores,
        mode="lines",
        line=dict(color="rgba(99, 110, 250, 0.3)", width=2, dash="dot"),
        showlegend=False,
    ))
    fig_timeline.add_trace(go.Scatter(
        x=daeun_labels, y=daeun_scores,
        mode="markers+text",
        marker=dict(size=16, color=daeun_colors, line=dict(width=2, color="white")),
        text=["용신 ✓" if s > 0 else "·" for s in daeun_scores],
        textposition="top center",
        showlegend=False,
    ))
    if postnatal.current_daeun:
        current_label = next(
            (l for l, d in zip(daeun_labels, postnatal.daeun)
             if d.ganji == postnatal.current_daeun.ganji), None
        )
        if current_label:
            fig_timeline.add_annotation(
                x=current_label, y=daeun_scores[daeun_labels.index(current_label)],
                text="← 현재 대운",
                showarrow=True, arrowhead=2, arrowcolor="#FF6B6B",
                font=dict(color="#FF6B6B", size=13),
                ax=50, ay=-30,
            )
    fig_timeline.update_layout(
        yaxis=dict(visible=False),
        xaxis=dict(tickangle=-45),
        height=300,
        margin=dict(l=20, r=20, t=30, b=80),
    )
    st.plotly_chart(fig_timeline, width="stretch")

    if postnatal.seun_clashes or postnatal.daeun_clashes:
        st.subheader("충(衝) 감지")
        for clash in postnatal.seun_clashes + postnatal.daeun_clashes:
            st.error(f"{clash['incoming']} ↔ {clash['target']} ({clash['pillar']})")

    if postnatal.seun_combines or postnatal.daeun_combines:
        st.subheader("합(合) 감지")
        for combine in postnatal.seun_combines + postnatal.daeun_combines:
            st.success(f"{combine['incoming']} ↔ {combine['target']} ({combine['pillar']}, {combine['type']})")

    st.header("영역별 운세")

    seun_sipsins = [postnatal.seun_stem[1], postnatal.seun_branch[1]]
    daeun_sipsins = [s for _, s in postnatal.daeun_sipsin]

    domain_names = []
    domain_scores = []
    domain_bar_colors = []
    for domain_name, domain_sipsins in DOMAIN_MAP.items():
        seun_hit = sum(1 for s in seun_sipsins if s in domain_sipsins)
        daeun_hit = sum(1 for s in daeun_sipsins if s in domain_sipsins)
        score = seun_hit * 2 + daeun_hit
        domain_names.append(domain_name)
        domain_scores.append(score)
        if score >= 3:
            domain_bar_colors.append("#4CAF50")
        elif score >= 1:
            domain_bar_colors.append("#FF9800")
        else:
            domain_bar_colors.append("#B0BEC5")

    fig_domain = go.Figure()
    fig_domain.add_trace(go.Bar(
        x=domain_names,
        y=domain_scores,
        marker_color=domain_bar_colors,
        text=[f"{s}점" for s in domain_scores],
        textposition="outside",
    ))
    fig_domain.update_layout(
        yaxis=dict(title="영향도", range=[0, max(domain_scores, default=1) + 1], dtick=1),
        xaxis=dict(title=""),
        height=300,
        margin=dict(l=40, r=20, t=30, b=30),
        showlegend=False,
    )
    st.plotly_chart(fig_domain, width="stretch")

    st.header("종합 해석")

    section_config = [
        ("성격·기질", summary.personality, "info"),
        ("오행 밸런스", summary.element_balance, None),
        ("용신 분석", summary.yongshin, None),
        ("영역별 운세", summary.fortune_by_domain, None),
        ("올해 운세", summary.annual_fortune, None),
        ("대운 흐름", summary.major_fortune, None),
        ("충·합 관계", summary.relationships, "warning"),
        ("종합 조언", summary.advice, "success"),
    ]

    for title, lines, style in section_config:
        if not lines:
            continue
        st.subheader(title)
        for line in lines:
            if style == "info":
                st.info(line)
            elif style == "warning":
                st.warning(line)
            elif style == "success":
                st.success(line)
            else:
                st.write(line)


if __name__ == "__main__":
    main()
