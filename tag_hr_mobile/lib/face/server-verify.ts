import { DATA_API_BASE_URL, DATA_API_ENDPOINT } from "@/constants/api";

import { USE_SERVER_VERIFY } from "@/lib/face/constants";

import { authFetch } from "@/utils/fetcher";



export type ServerVerifyInput = {

  nik?: string;

  captureEmbeddings: number[][];

  localMinScore: number;

  localAvgScore: number;

  captureBase64?: string;

};



export type ServerVerifyResult = {

  verified: boolean;

  score: number;

  message?: string;

};



/**

 * Hybrid verification layer.

 * Phase 1: trusts on-device conservative score (no ERP API).

 * Phase 2: set USE_SERVER_VERIFY=true — server compares embedding vs official NIK record.

 */

export async function verifyFaceOnServer(

  input: ServerVerifyInput,

): Promise<ServerVerifyResult> {

  const { localMinScore, localAvgScore } = input;



  if (!USE_SERVER_VERIFY) {

    return {

      verified: localMinScore > 0,

      score: localMinScore,

    };

  }



  if (!input.nik) {

    return {

      verified: false,

      score: localMinScore,

      message: "NIK tidak tersedia untuk verifikasi server.",

    };

  }



  try {

    const res = await authFetch(

      `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.VERIFY_FACE_MOBILE}`,

      {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          Nik: input.nik,

          CaptureEmbedding: input.captureEmbeddings[0] ?? [],

          CaptureEmbeddings: input.captureEmbeddings,

          LocalMinScore: localMinScore,

          LocalAvgScore: localAvgScore,

          PhotoBase64: input.captureBase64 ?? "",

        }),

      },

    );



    const json = await res.json();

    if (!json?.Metadata?.Success) {

      return {

        verified: false,

        score: localMinScore,

        message: json?.Metadata?.Message ?? "Verifikasi server gagal.",

      };

    }



    const serverScore =

      typeof json?.Data?.Score === "number" ? json.Data.Score : localMinScore;

    const serverVerified =

      typeof json?.Data?.Verified === "boolean"

        ? json.Data.Verified

        : serverScore >= localMinScore;



    return {

      verified: serverVerified,

      score: serverScore,

      message: json?.Data?.Message,

    };

  } catch (err) {

    const message =

      err instanceof Error ? err.message : "Verifikasi server gagal.";

    return {

      verified: false,

      score: localMinScore,

      message,

    };

  }

}

