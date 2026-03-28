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
}

export interface AnalysisResult {
  // 사주 원국
  pillars: string[];
  day_stem: string;

  // 오행·강약·용신
  element_stats: Record<string, number>;
  strength_value: number;
  strength_label: string;
  my_element: { name: string; meaning: string };
  yongshin_info: { name: string; meaning: string };

  // 세운
  year: number;
  seun_ganji: string;
  seun_stem: SipsinInfo;
  seun_branch: SipsinInfo;
  yongshin_in_seun: boolean;
  yongshin_in_daeun: boolean;

  // 대운
  daeun: DaeunPeriod[];
  current_daeun: CurrentDaeun | null;
  daeun_sipsin: SipsinInfo[];

  // 충·합
  seun_clashes: ClashInfo[];
  seun_combines: CombineInfo[];
  daeun_clashes: ClashInfo[];
  daeun_combines: CombineInfo[];

  // 영역별 점수
  domain_scores: Record<string, DomainScore>;

  // 십신·십이운성·신살
  sipsin: SipsinInfo[];
  sibi_unseong: SibiUnseongInfo[];
  sinsal: SinsalInfo[];

  // 텍스트 해석
  personality: string[];
  element_balance: string[];
  yongshin: string[];
  fortune_by_domain: string[];
  annual_fortune: string[];
  major_fortune: string[];
  relationships: string[];
  advice: string[];
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
