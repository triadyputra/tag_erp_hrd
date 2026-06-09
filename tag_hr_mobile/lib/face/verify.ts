import { withTimeout } from "@/lib/face/async";

import {

  MIN_AVG_SCORE,

  MIN_FRAME_SCORE,

  REQUIRED_CAPTURE_FRAMES,

  SIMILARITY_THRESHOLD,

} from "@/lib/face/constants";

import {

  buildFaceEmbeddingVariants,

  scoreCaptureBatches,

} from "@/lib/face/pipeline";

import { verifyFaceOnServer } from "@/lib/face/server-verify";

import { logVerifyScores } from "@/lib/face/tuning";



export type VerifyResult = {

  verified: boolean;

  score: number;

  message: string;

};



export async function getCaptureEmbeddingVariants(

  uri: string,

): Promise<number[][]> {

  return withTimeout(

    buildFaceEmbeddingVariants(uri),

    30000,

    "Pemrosesan wajah terlalu lama. Coba lagi dengan pencahayaan yang cukup.",

  );

}



export async function getEmbeddingFromCaptureUri(uri: string): Promise<number[]> {

  const variants = await getCaptureEmbeddingVariants(uri);

  return variants[0];

}



export async function verifyCaptureBatches(

  captureBatches: number[][][],

  referenceEmbeddings: number[] | number[][],

  options?: {

    nik?: string;

    captureBase64?: string;

  },

): Promise<VerifyResult> {

  const refs = Array.isArray(referenceEmbeddings[0])

    ? (referenceEmbeddings as number[][])

    : [referenceEmbeddings as number[]];



  if (captureBatches.length < REQUIRED_CAPTURE_FRAMES) {

    return {

      verified: false,

      score: 0,

      message: `Butuh ${REQUIRED_CAPTURE_FRAMES} sampel wajah untuk verifikasi.`,

    };

  }



  const batchResult = scoreCaptureBatches(refs, captureBatches);

  const { minScore, avgScore, batchScores } = batchResult;



  const weakFrame = batchScores.findIndex((score) => score < MIN_FRAME_SCORE);

  if (weakFrame >= 0) {

    logVerifyScores(batchResult, false, "weak_frame");

    return {

      verified: false,

      score: minScore,

      message: `Sampel ${weakFrame + 1} kurang jelas (${Math.round(batchScores[weakFrame] * 100)}%). Tahan wajah stabil dan coba lagi.`,

    };

  }



  if (captureBatches.length > 1 && avgScore < MIN_AVG_SCORE) {

    logVerifyScores(batchResult, false, "low_average");

    return {

      verified: false,

      score: minScore,

      message: `Kecocokan rata-rata terlalu rendah (${Math.round(avgScore * 100)}%). Perbarui foto profil dengan selfie frontal.`,

    };

  }



  if (minScore < SIMILARITY_THRESHOLD) {

    logVerifyScores(batchResult, false, "below_threshold");

    return {

      verified: false,

      score: minScore,

      message: `Verifikasi wajah gagal (min ${Math.round(minScore * 100)}%, rata-rata ${Math.round(avgScore * 100)}%). Gunakan selfie terbaru sebagai foto profil, lalu coba lagi.`,

    };

  }



  const server = await verifyFaceOnServer({

    nik: options?.nik,

    captureEmbeddings: captureBatches.flat(),

    localMinScore: minScore,

    localAvgScore: avgScore,

    captureBase64: options?.captureBase64,

  });



  if (!server.verified) {

    logVerifyScores(batchResult, false, "server_reject");

    return {

      verified: false,

      score: server.score,

      message: server.message ?? "Verifikasi server gagal. Coba lagi.",

    };

  }



  logVerifyScores(batchResult, true);

  return {

    verified: true,

    score: server.score,

    message: `Verifikasi berhasil (${Math.round(server.score * 100)}%)`,

  };

}



/** @deprecated Use verifyCaptureBatches for multi-frame verification. */

export async function verifyCaptureEmbeddings(

  captureEmbeddings: number[][],

  referenceEmbeddings: number[] | number[][],

  captureBase64?: string,

): Promise<VerifyResult> {

  return verifyCaptureBatches([captureEmbeddings], referenceEmbeddings, {

    captureBase64,

  });

}

