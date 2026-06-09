import {
  BLINK_EYE_CLOSED_THRESHOLD,
  BLINK_EYE_DROP_DELTA,
  MAX_PITCH,
  MAX_ROLL,
  MAX_YAW,
  MIN_EYE_OPEN_PROB,
  MIN_FACE_SIZE_RATIO,
} from "@/lib/face/constants";

export type DetectedFace = {
  yawAngle?: number;
  pitchAngle?: number;
  rollAngle?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  bounds?: {
    width: number;
    height: number;
  };
};

export type LivenessResult = {
  ok: boolean;
  message: string;
};

function averageEyeOpen(face: DetectedFace): number | null {
  const left = face.leftEyeOpenProbability;
  const right = face.rightEyeOpenProbability;
  if (left == null || right == null) return null;
  return (left + right) / 2;
}

/** Pose/framing only — safe while user is blinking. */
export function checkPoseLiveness(
  face: DetectedFace,
  frameWidth = 1,
): LivenessResult {
  if (!face.bounds) {
    return { ok: false, message: "Wajah tidak terdeteksi" };
  }

  const faceRatio = face.bounds.width / frameWidth;
  if (faceRatio < MIN_FACE_SIZE_RATIO) {
    return { ok: false, message: "Dekatkan wajah sedikit" };
  }

  const yaw = Math.abs(face.yawAngle ?? 0);
  const pitch = Math.abs(face.pitchAngle ?? 0);
  const roll = Math.abs(face.rollAngle ?? 0);

  if (yaw > MAX_YAW || pitch > MAX_PITCH || roll > MAX_ROLL) {
    return { ok: false, message: "Hadapkan wajah lurus" };
  }

  return { ok: true, message: "Posisi OK" };
}

export function checkEyesOpen(face: DetectedFace): LivenessResult {
  const eyeAvg = averageEyeOpen(face);
  if (eyeAvg == null) {
    return { ok: true, message: "Siap verifikasi" };
  }

  if (eyeAvg < MIN_EYE_OPEN_PROB) {
    return { ok: false, message: "Buka mata" };
  }

  return { ok: true, message: "Siap verifikasi" };
}

export function checkLiveness(
  face: DetectedFace,
  frameWidth = 1,
): LivenessResult {
  const pose = checkPoseLiveness(face, frameWidth);
  if (!pose.ok) return pose;
  return checkEyesOpen(face);
}

type BlinkPhase = "await_open" | "await_close" | "await_reopen" | "done";

/** One blink: open → close → open. Pose checked separately so blink does not loop. */
export class BlinkLivenessTracker {
  private phase: BlinkPhase = "await_open";
  private baselineOpen = 0;

  reset(): void {
    this.phase = "await_open";
    this.baselineOpen = 0;
  }

  isDone(): boolean {
    return this.phase === "done";
  }

  private eyesClosed(eyeAvg: number): boolean {
    if (eyeAvg <= BLINK_EYE_CLOSED_THRESHOLD) return true;
    if (this.baselineOpen > 0 && eyeAvg <= this.baselineOpen - BLINK_EYE_DROP_DELTA) {
      return true;
    }
    return false;
  }

  update(face: DetectedFace): LivenessResult {
    if (this.phase === "done") {
      return { ok: true, message: "Kedipan OK — tahan sebentar" };
    }

    const eyeAvg = averageEyeOpen(face);

    switch (this.phase) {
      case "await_open":
        if (eyeAvg != null && eyeAvg >= MIN_EYE_OPEN_PROB) {
          this.baselineOpen = Math.max(this.baselineOpen, eyeAvg);
          this.phase = "await_close";
        }
        return { ok: false, message: "Kedipkan mata sekali" };

      case "await_close":
        if (eyeAvg != null && this.eyesClosed(eyeAvg)) {
          this.phase = "await_reopen";
          return { ok: false, message: "Buka mata kembali" };
        }
        if (eyeAvg != null && eyeAvg > this.baselineOpen) {
          this.baselineOpen = eyeAvg;
        }
        return { ok: false, message: "Kedipkan mata sekali" };

      case "await_reopen":
        if (eyeAvg != null && eyeAvg >= MIN_EYE_OPEN_PROB) {
          this.phase = "done";
          return { ok: true, message: "Kedipan OK — tahan sebentar" };
        }
        return { ok: false, message: "Buka mata kembali" };

      default:
        return { ok: false, message: "Kedipkan mata sekali" };
    }
  }
}
