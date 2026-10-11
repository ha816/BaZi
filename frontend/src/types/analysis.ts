export interface SipsinInfo {
  char: string;
  sipsin_name: string;
  sipsin_korean: string;
  domain: string;
  element: string;
  rel: string;
  rel_kind: "same" | "help_out" | "restrain_out" | "restrain_in" | "help_in";
  yinyang: "일치" | "다름";
  target_yin_yang: "양" | "음";
  timing_meaning?: string;
}

export interface MonthSipsin {
  name: string;
  korean: string;
  domain: string;
  meaning: string;
}

export interface SibiUnseongInfo {
  pillar: string;
  unseong_name: string;
  unseong_korean: string;
  meaning: string;
  strength: "strong" | "weak" | "mid";
}

export interface SinsalInfo {
  branch: string;
  sinsal_korean: string;
  meaning: string;
}

export interface DaeunPeriod {
  ganji: string;
  start_age: number;
  end_age: number;
  has_yongshin: boolean;
  is_current: boolean;
}

export interface CurrentDaeun {
  ganji: string;
  start_age: number;
  end_age: number;
}

export interface ClashInfo {
  incoming: string;
  incoming_korean: string;
  target: string;
  target_korean: string;
  pillar: string;
  area_label: string;
  narrative: string;
}

export interface CombineInfo {
  incoming: string;
  incoming_korean: string;
  target: string;
  target_korean: string;
  pillar: string;
  area_label: string;
  type: "천간합" | "지지합";
  harmony_element: string;
  harmony_element_korean: string;
  narrative: string;
}

export interface DomainScore {
  score: number;
  level: string;
  reason: string;
}

export interface PillarElementInfo {
  stem_element: string;
  branch_element: string;
}

export interface JizanGanItem {
  stem: string;
  stem_korean: string;
  sipsin_name: string;
  weight: number;
  role: string;
  role_hanja: string;
}

export interface NatalResult {
  pillars: string[];
  day_stem: string;
  day_stem_korean: string;
  day_stem_yin_yang: string;
  pillar_stems_korean: string[];
  pillar_branches_korean: string[];
  pillar_elements: PillarElementInfo[];
  element_stats: Record<string, number>;
  /** 일간 기운 세기 0~100 (50 이상 신강). 옛 결과엔 없음 */
  strength_pct?: number;
  strength_label: string;
  my_element: { name: string; meaning: string };
  yongshin_info: { name: string; meaning: string };
  kisin_info: { name: string; meaning: string };
  yongshin_guide: { color: string; direction: string; career: string; daily: string };
  kisin_guide: { color: string; direction: string; career: string; daily: string };
  sipsin: SipsinInfo[];
  sibi_unseong: SibiUnseongInfo[];
  sinsal: SinsalInfo[];
  jizan_gan: JizanGanItem[][];
  sibi_sinsal: string[];
  gongmang: boolean[];
  pillar_summary: string;
  hour_unknown?: boolean; // 시주 없음 — pillars·sipsin·sibi_unseong 등이 3개
  narratives: {
    pillar_tip: string;
    ohaeng_tip: string;
    sipsin_story: string;
    unseong_story: string;
    sibi_sinsal_story: string;
    sinsal_narrative: string;
    strength_tip: string;
    yongshin_tip: string;
  };
  personality: InterpretBlock[];
  element_balance: InterpretBlock[];
  feng_shui: FengShuiResult | null;
  zodiac: ZodiacResult | null;
}

export interface TrigramInfo {
  char: string;
  reading: string;
  element: string;
  element_korean: string;
  description: string;
}

export interface LuckyDirection {
  direction: string;
  kind_korean: string;
  kind_han: string;
  meaning: string;
  usage: string;
}

export interface UnluckyDirection {
  direction: string;
  kind_korean: string;
  kind_han: string;
  meaning: string;
}

export interface FengShuiResult {
  kua_number: number;
  trigram: TrigramInfo;
  group: string;
  is_eastern: boolean;
  lucky_directions: LuckyDirection[];
  unlucky_directions: UnluckyDirection[];
  avoid_advice: string;
  interior_intro: string;
  interior_tips: InterpretTip[];
}

export interface ZodiacInfo {
  branch: string;
  korean: string;
  emoji: string;
  keyword: string;
  traits: string[];
  strength: string;
  weakness: string;
  compatible: string[];
}

export interface ZodiacRelation {
  branch: string;
  info: ZodiacInfo;
  relation: string;
  relation_label: string;
}

export interface PillarZodiac {
  branch: string;
  info: ZodiacInfo;
  pillar_label: string;
  role: string;
  role_desc: string;
  is_year: boolean;
}

export interface SamhapInfo {
  element: string;
  label: string;
  members: string[];
  in_pillars: boolean;
}

export interface PillarPair {
  i: number;
  j: number;
  pillar_label_a: string;
  pillar_label_b: string;
  branch_a: string;
  branch_b: string;
  zodiac_a: string;
  zodiac_b: string;
  relation: string;
  relation_label: string;
}

export interface ZodiacResult {
  year_branch: string;
  year_info: ZodiacInfo;
  relations: ZodiacRelation[];
  pillar_zodiacs: PillarZodiac[];
  pillar_pairs: PillarPair[];
  pillar_tip: string;
  samhap: SamhapInfo | null;
}

export interface Summary {
  me: string;
  year: string;
  month: string;
  today: string;
  caution: string;
  today_date: string;
  energy: string;
  timing: string;
  yongshin: string;
  zodiac: string;
  fengshui: string;
}

export interface TimingMonth {
  year: number;
  month: number;
  ganji: string;
  ganji_korean: string;
  score: number;
  level: "좋음" | "보통" | "피할";
  reason: string;
  tip: string;
}

export interface PostnatalResult {
  year: number;
  seun_ganji: string;
  seun_stem: SipsinInfo;
  seun_branch: SipsinInfo;
  yongshin_in_seun: boolean;
  yongshin_in_daeun: boolean;
  daeun: DaeunPeriod[];
  current_daeun: CurrentDaeun | null;
  daeun_sipsin: SipsinInfo[];
  seun_clashes: ClashInfo[];
  seun_combines: CombineInfo[];
  daeun_clashes: ClashInfo[];
  daeun_combines: CombineInfo[];
  domain_scores: Record<string, DomainScore>;
  samjae: { type: string; year_branch: string; birth_branch: string } | null;
  nearest_yongshin_year: number | null;
  upcoming_months: Array<{
    year: number;
    month: number;
    ganji: string;
    stem_element: string;
    branch_element: string;
    stem_sipsin: SipsinInfo;
    branch_sipsin: SipsinInfo;
    matches_yongshin: boolean;
  }>;
  month_badges: Record<string, string[]>;
  timing?: Record<string, TimingMonth[]>; // 영역별 12개월 (R3)
  year_zodiac_relations: Array<{ year: number; ganji: string; branch: string; kor: string; relation: string; desc: string; info: ZodiacInfo }>;
  year_zodiac_narrative: string;
  core_summary: string;
  llm_interpretation: string;
  summary?: Summary | null;
  yongshin: InterpretBlock[];
  fortune_by_domain: InterpretBlock[];
  annual_fortune: InterpretBlock[];
  samjae_fortune: InterpretBlock[];
  major_fortune: InterpretBlock[];
  relationships: InterpretBlock[];
  advice: InterpretBlock[];
}

export interface AnalysisResult {
  natal: NatalResult;
  postnatal: PostnatalResult;
  /** 내 사주 맞춰 보기(V3) 10문항 — 백엔드 self_quiz. 옛 응답엔 없음 */
  self_quiz?: SelfQuizItem[];
}

export interface AnalysisInput {
  birth_dt: string; // ISO format: "1990-10-10T14:30:00"
  gender: "male" | "female";
  analysis_year: number;
  city?: string;
  longitude?: number;
  hour_unknown?: boolean; // 출생시간 미상 → 세 기둥(三柱) 분석
}

export interface InterpretTip {
  label: string;
  text: string;
}

export interface InterpretBlock {
  description: string;
  category: string | null;
  tips: InterpretTip[];
}

export type DomainSignalKind = "harmony" | "clash" | "sinsal" | "sipsin" | "element" | "fortune";

export interface DomainSignal {
  kind: DomainSignalKind;
  text: string;
}

export type RelationType = "lover" | "friend" | "family";

export interface CompatibilityDomainScore {
  score: number;
  level: string;
  reason: string;
  display_name?: string;
  // 캐시 호환: 이전엔 string[], 신규는 DomainSignal[]
  pros?: Array<string | DomainSignal>;
  cons?: Array<string | DomainSignal>;
  narrative?: string;
  advice?: string;
}

export interface PalmLineScores {
  heart: number;
  head: number;
  life: number;
}

export interface PalmistryResult {
  hand_element: string;
  hand_type_korean: string;
  finger_ratio: number;
  aspect_ratio: number;
  line_scores: PalmLineScores;
  blocks: InterpretBlock[];
}

export interface PillarRelation {
  pillar1: string;        // "年柱" | "月柱" | "日柱" | "時柱"
  pillar2: string;
  kind:
    | "stem_combine"
    | "stem_clash"
    | "branch_combine"
    | "branch_clash"
    | "wonjin"
    | "hyung"
    | "hae"
    | "pa"
    | "samhap";
  label: string;          // "卯戌 육합", "丑未 충"
  polarity: 1 | -1 | 0;
}

export interface PillarSnapshot {
  pillars: string[];                  // ["甲子", "丙寅", ...]
  day_stem: string;                   // "甲"
  element_stats: Record<string, number>;
  my_main_element: string;
  strength_label: string;
  yongshin: string;
  hour_unknown?: boolean;
  /** 기둥별 십이신살 (년·월·일·시 순, ""=없음). 옛 캐시엔 없음 */
  sibi_sinsal?: string[];
  /** 일간 기운 세기 0~100 (50 이상 신강). 옛 캐시엔 없음 */
  strength_pct?: number | null;
}

export interface ElementComplement {
  p1_lacks: string[];
  p1_provides: string[];
  p2_lacks: string[];
  p2_provides: string[];
  overlap_strong: string[];
  score: number;
}

export interface SamhapCompletion {
  element: string;          // "火" | "水" | "金" | "木"
  branches: string[];       // ["寅", "午", "戌"]
  p1_branches: string[];
  p2_branches: string[];
}

export interface CompatibilityResult {
  total_score: number;
  label: string;
  domain_scores: Record<string, CompatibilityDomainScore>;
  description: string;
  stem_combine: boolean;
  branch_combine: boolean;
  branch_clash: boolean;
  pillar1_snapshot: PillarSnapshot | null;
  pillar2_snapshot: PillarSnapshot | null;
  pillar_relations: PillarRelation[];
  element_complement: ElementComplement;
  shared_sinsal: string[];
  unique_sinsal_1: string[];
  unique_sinsal_2: string[];
  samhap_completions: SamhapCompletion[];
  key_traits: string[];
  narrative: string | null;
  /** 한눈에 4줄 — 백엔드 compatibility_summary. {p1}·{p2}는 이름 토큰(프론트가 치환). 옛 응답엔 없을 수 있음 */
  summary?: CompatSummary;
  /** 띠궁합 — 백엔드 compatibility_zodiac. 스냅샷 없으면 null */
  zodiac?: CompatZodiac | null;
  /** 궁합 캐릭터 — 백엔드 compatibility_character (관계 유형별 문장). 옛 응답·일간 없으면 없음 */
  character?: CompatCharacter | null;
}

export interface CompatCharacter {
  /** 예: "끌리는 장작과 모닥불 커플" */
  title: string;
  kind: "generate" | "overcome" | "same";
  /** 그림 키 — frontend/public/kkachi/compat/{key}.png (주는 쪽 오행 먼저, 예: 木火·土土) */
  key: string;
  roles: { token: string; name: string; element: string; emoji: string }[];
  desc: string;
  /** 이럴 때 두 분은? — who: p1 | p2 | both */
  scenarios: { q: string; who: "p1" | "p2" | "both"; reason: string }[];
}

export interface CompatZodiacYear {
  year: number;
  ganji: string;
  branch: string;
  kor: string;
  emoji: string;
  /** 그해 띠와 각자 띠의 관계: 나(본명년)·삼합·육합·충·원진·보통 */
  rel1: string;
  rel2: string;
}

export interface CompatZodiacMini {
  branch: string;
  korean: string;
  emoji: string;
}

export interface CompatChunghap {
  relation: string;
  title: string;
  explain: string;
  /** 삼합일 때 세 자리와 완성시키는 세 번째 띠 */
  trio: { branches: string[]; element: string; third: CompatZodiacMini } | null;
  /** 12띠(子부터 시계 방향) 각자와의 관계 */
  ring: (CompatZodiacMini & { rel1: string; rel2: string })[];
  /** 두 분 모두와 삼합·육합인 띠 */
  friends: CompatZodiacMini[];
}

export interface CompatPillarZodiac {
  columns: { label: string; role: string; p1: CompatZodiacMini | null; p2: CompatZodiacMini | null; relation: string }[];
  cross: { p1_pillar: string; p2_pillar: string; p1: CompatZodiacMini; p2: CompatZodiacMini; relation: string; relation_label: string }[];
  tip: string;
}

export interface CompatZodiac {
  p1: ZodiacInfo;
  p2: ZodiacInfo;
  relation: string;
  relation_label: string;
  headline: string;
  /** 옛 응답엔 없을 수 있음 */
  chunghap?: CompatChunghap;
  pillars?: CompatPillarZodiac | null;
  years: CompatZodiacYear[];
  years_line: string;
}

export interface CompatSummary {
  pillars: string;
  element: string;
  /** 두 사람 신강·신약 조합 한 줄 (옛 응답엔 없음) */
  strength?: string;
  /** 사람별 강약 풀이 (라벨·성향·팁·용신 이유) */
  strength_p1?: string;
  strength_p2?: string;
  sinsal: string;
  /** 띠 관계 한 줄 */
  zodiac?: string;
  domain: string;
}

export interface PersonInput {
  name: string;
  gender: "male" | "female";
  birth_dt: string;
  city: string;
  hour_unknown?: boolean;
}

export interface CompatibilityInput {
  person1: PersonInput;
  person2: PersonInput;
  year: number;
  relation_type?: RelationType;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  member_id: string;
  name: string;
  gender: "male" | "female";
  birth_dt: string;
  city: string;
  is_self: boolean;
  birth_hour_unknown: boolean;
  created_at: string;
}

export interface ProfileCreateInput {
  name: string;
  gender: "male" | "female";
  birth_dt: string;
  city: string;
  is_self?: boolean;
  birth_hour_unknown?: boolean;
}

export interface ProfileUpdateInput {
  name: string;
  gender: "male" | "female";
  birth_dt: string;
  city: string;
  birth_hour_unknown?: boolean;
}

export interface DailyDomainScore {
  score: number;
  level: string;
  reason: string;
}

export interface HourlyWeather {
  hour: string;
  temperature: number;
  condition: string;
  element: string;
}

export interface DailyWeather {
  date?: string;
  temperature: number;
  temp_min?: number;
  temp_max?: number;
  element: string;
  condition: string;
  hours?: HourlyWeather[];
}

export interface DailyFortune {
  date: string;
  day_pillar: string;
  day_element: string;
  total_score: number;
  level: string;
  domain_scores: Record<string, DailyDomainScore>;
  description: string;
  tips: string[];
  weather: DailyWeather | null;
  solar_term?: string;
  yongshin?: string;
  son_eomneun_nal?: boolean;
  daeun_ganji?: string | null;
  seun_ganji?: string;
  wol_ganji?: string;
  yongshin_in_daeun?: boolean;
  yongshin_in_seun?: boolean;
  yongshin_in_wol?: boolean;
  yongshin_in_il?: boolean;
  // 아침 한 마디 (백엔드 fortune_rules._make_brief)
  headline?: string;
  action?: string;
  caution?: string;
}

// 결과 공유 카드 (/s/[id]) — 백엔드 KkachiService.build_share_card() 스냅샷. 생년월일·성별은 없다
export interface ShareCard {
  kind?: "saju"; // 없으면 사주 카드
  name: string;
  year: number;
  pillars: string[];
  pillar_stems_korean?: string[];    // 경·병·무·기 (2026-09-28 이후 카드)
  pillar_branches_korean?: string[]; // 오·술·신·미
  pillar_elements: PillarElementInfo[];
  hour_unknown: boolean;
  day_stem: string;
  day_stem_korean: string;
  my_element: { name: string; meaning: string };
  element_stats: Record<string, number>;
  strength_label: string;
  yongshin: { name: string; meaning: string };
  pillar_summary: string;
  sinsal: string[];
  summary: { me?: string; energy?: string; yongshin?: string; year?: string; caution?: string };
}

// 시운 공유 카드 (/s/[id], kind="daily") — 백엔드 build_daily_share_card() 스냅샷
export interface DailyShareCard {
  kind: "daily";
  name: string;
  is_self: boolean;
  date: string;
  day_pillar: string;
  day_pillar_korean: string;
  day_element: string;
  total_score: number;
  level: string;
  headline: string;
  action: string;
  caution: string;
  tips: string[];
  weather: { condition: string; element: string; temperature: number } | null;
  solar_term?: string | null;
  son_eomneun_nal: boolean;
  yongshin?: string | null;
}

export type AnyShareCard = ShareCard | DailyShareCard | CompatShareCard;

// 궁합 공유 카드 (/s/[id], kind="compat") — 백엔드 build_compat_share_card() 스냅샷
export interface CompatShareCard {
  kind: "compat";
  name1: string;
  name2: string;
  relation_type: RelationType;
  relation_label: string;
  total_score: number;
  label: string;
  description: string;
  domain_scores: Record<string, { score: number; level: string }>;
  key_traits: string[];
  shared_sinsal: string[];
  p1: { stem: string; korean: string; element: string; hour_unknown?: boolean };
  p2: { stem: string; korean: string; element: string; hour_unknown?: boolean };
  /** 궁합 캐릭터 칭호 — 이름은 채워져 있다. 옛 카드·일간 없음이면 없음 */
  character?: { title: string; key: string; roles: { name: string; element: string; emoji: string }[]; desc: string } | null;
}

export interface SelfQuizItem {
  q: string;
  /** 십신 한자 (예: 食神) */
  basis: string;
  count: number;
  /** 사주 예측: 그렇다 / 반반 / 아니다 */
  predict: "yes" | "half" | "no";
  reason: string;
}
