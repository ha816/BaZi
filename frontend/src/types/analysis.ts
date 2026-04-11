export interface SipsinInfo {
  char: string;
  sipsin_name: string;
  domain: string;
  element: string;
}

export interface SibiUnseongInfo {
  pillar: string;
  unseong_name: string;
  meaning: string;
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
  target: string;
  pillar: string;
}

export interface CombineInfo {
  incoming: string;
  target: string;
  pillar: string;
  type: string;
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

export interface NatalResult {
  pillars: string[];
  day_stem: string;
  day_stem_yin_yang: string;
  pillar_elements: PillarElementInfo[];
  element_stats: Record<string, number>;
  strength_value: number;
  strength_label: string;
  my_element: { name: string; meaning: string };
  yongshin_info: { name: string; meaning: string };
  sipsin: SipsinInfo[];
  sibi_unseong: SibiUnseongInfo[];
  sinsal: SinsalInfo[];
  pillar_summary: string;
  personality: InterpretBlock[];
  element_balance: InterpretBlock[];
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
  year_zodiac_relations: Array<{ year: number; ganji: string; branch: string; kor: string; relation: string; desc: string }>;
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
  created_at: string;
}

export interface ProfileCreateInput {
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
}
