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
  strength_value: number;
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
}

export interface FengShuiResult {
  kua_number: number;
  trigram: TrigramInfo;
  group: string;
  is_eastern: boolean;
  lucky_directions: LuckyDirection[];
  unlucky_directions: string[];
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
  year_zodiac_relations: Array<{ year: number; ganji: string; branch: string; kor: string; relation: string; desc: string; info: ZodiacInfo }>;
  year_zodiac_narrative: string;
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
}

export interface BasicResult {
  pillars: string[];
  day_stem: string;
  element_stats: Record<string, number>;
  my_element: { name: string; meaning: string };
  year_branch: string;
  zodiac_relation: string;
}

export interface AnalysisInput {
  birth_dt: string; // ISO format: "1990-10-10T14:30:00"
  gender: "male" | "female";
  analysis_year: number;
  city?: string;
  longitude?: number;
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

export interface CompatibilityDomainScore {
  score: number;
  level: string;
  reason: string;
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

export interface CompatibilityResult {
  total_score: number;
  label: string;
  domain_scores: Record<string, CompatibilityDomainScore>;
  description: string;
  stem_combine: boolean;
  branch_combine: boolean;
  branch_clash: boolean;
}

export interface PersonInput {
  name: string;
  gender: "male" | "female";
  birth_dt: string;
  city: string;
}

export interface CompatibilityInput {
  person1: PersonInput;
  person2: PersonInput;
  year: number;
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
  created_at: string;
}

export interface ProfileCreateInput {
  name: string;
  gender: "male" | "female";
  birth_dt: string;
  city: string;
  is_self?: boolean;
}

export interface ProfileUpdateInput {
  name: string;
  gender: "male" | "female";
  birth_dt: string;
  city: string;
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
}
