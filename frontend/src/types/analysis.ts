export interface OhengInfo {
  name: string;
  meaning: string;
}

export interface SipsinInfo {
  char: string;
  sipsin_name: string;
  domain: string;
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

export interface StrengthInfo {
  value: number;
  label: string;
}

export interface SajuResponse {
  pillars: string[];
  day_stem: string;
}

export interface NatalResponse {
  my_main_element: OhengInfo;
  element_stats: Record<string, number>;
  strength: StrengthInfo;
  yongshin: OhengInfo;
  personality: string;
  sipsin: SipsinInfo[];
  sibi_unseong: SibiUnseongInfo[];
  sinsal: SinsalInfo[];
}

export interface DaeunPeriodResponse {
  ganji: string;
  start_age: number;
  end_age: number;
  has_yongshin: boolean;
  is_current: boolean;
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

export interface DomainScoreInfo {
  score: number;
  level: string;
}

export interface PostnatalResponse {
  year: number;
  seun_ganji: string;
  seun_stem: SipsinInfo;
  seun_branch: SipsinInfo;
  yongshin_in_seun: boolean;
  yongshin_in_daeun: boolean;
  current_daeun: DaeunPeriodResponse | null;
  daeun_sipsin: SipsinInfo[];
  daeun: DaeunPeriodResponse[];
  seun_clashes: ClashInfo[];
  seun_combines: CombineInfo[];
  daeun_clashes: ClashInfo[];
  daeun_combines: CombineInfo[];
  domain_scores: Record<string, DomainScoreInfo>;
}

export interface InterpretationResponse {
  personality: string[];
  element_balance: string[];
  yongshin: string[];
  fortune_by_domain: string[];
  annual_fortune: string[];
  major_fortune: string[];
  relationships: string[];
  advice: string[];
}

export interface AnalysisResponse {
  saju: SajuResponse;
  natal: NatalResponse;
  postnatal: PostnatalResponse;
  interpretation: InterpretationResponse;
}

export interface AnalysisInput {
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number;
  birth_minute: number;
  gender: "male" | "female";
  analysis_year: number;
  city?: string;
}
