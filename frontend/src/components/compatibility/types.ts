import type { CompatibilityResult } from "@/types/analysis";

/** 궁합 결과 탭 공통 props — CompatibilityResult(오케스트레이터)가 spread로 넘긴다. 캐시 기본값은 이미 채워져 있다 */
export interface CompatTabProps {
  data: CompatibilityResult;
  name1: string;
  name2: string;
}
