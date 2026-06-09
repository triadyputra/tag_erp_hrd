import { FACE_VERIFY_DEBUG } from "@/lib/face/constants";
import type { BatchScoreResult } from "@/lib/face/pipeline";

export type VerifyScoreLog = {
  minScore: number;
  avgScore: number;
  batchScores: number[];
  passed: boolean;
  reason?: string;
};

export function logVerifyScores(
  result: BatchScoreResult,
  passed: boolean,
  reason?: string,
): void {
  if (!FACE_VERIFY_DEBUG) return;

  const payload: VerifyScoreLog = {
    minScore: result.minScore,
    avgScore: result.avgScore,
    batchScores: result.batchScores,
    passed,
    reason,
  };

  console.log("[FaceVerify]", JSON.stringify(payload, null, 2));
}
