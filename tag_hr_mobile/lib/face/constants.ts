/** Log per-sample scores in dev builds to help threshold tuning on device. */
export const FACE_VERIFY_DEBUG = __DEV__;

/** Single-shot verification — fast UX. */
export const REQUIRED_CAPTURE_FRAMES = 1;

/** Pass threshold (cosine similarity). Raised for lower false-accept risk. */
export const SIMILARITY_THRESHOLD = 0.55;

/** Floor for the captured frame. */
export const MIN_FRAME_SCORE = 0.5;

/** Only enforced when REQUIRED_CAPTURE_FRAMES > 1. */
export const MIN_AVG_SCORE = 0.52;

/** Max head pose angles (degrees). */
export const MAX_YAW = 20;
export const MAX_PITCH = 20;
export const MAX_ROLL = 25;

/** Minimum eye-open probability. */
export const MIN_EYE_OPEN_PROB = 0.5;

/** Eyes considered closed during blink. */
export const BLINK_EYE_CLOSED_THRESHOLD = 0.45;

/** Relative drop from baseline to count as blink. */
export const BLINK_EYE_DROP_DELTA = 0.18;

/** Minimum face size as fraction of frame width. */
export const MIN_FACE_SIZE_RATIO = 0.18;

/** ArcFace input dimensions. */
export const FACE_INPUT_SIZE = 112;

export type ArcFaceModelProfile = "mobile" | "accurate";

export const ARCFACE_MODEL_PROFILE: ArcFaceModelProfile = "mobile";

const ARCFACE_MODELS: Record<
  ArcFaceModelProfile,
  { url: string; filename: string; minBytes: number }
> = {
  mobile: {
    url: "https://huggingface.co/deepghs/insightface/resolve/main/buffalo_s/w600k_mbf.onnx",
    filename: "w600k_mbf.onnx",
    minBytes: 12_000_000,
  },
  accurate: {
    url: "https://huggingface.co/deepghs/insightface/resolve/main/buffalo_l/w600k_r50.onnx",
    filename: "w600k_r50.onnx",
    minBytes: 150_000_000,
  },
};

const activeModel = ARCFACE_MODELS[ARCFACE_MODEL_PROFILE];

export const ARCFACE_MODEL_URL = activeModel.url;
export const ARCFACE_MODEL_FILENAME = activeModel.filename;
export const ARCFACE_MODEL_MIN_BYTES = activeModel.minBytes;

export const USE_SERVER_VERIFY = false;
export const USE_SERVER_ENROLLMENT = false;
