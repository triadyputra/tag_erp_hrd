import FaceScanner from "@/components/face/FaceScanner";

import { FaceScanError, FaceScanLoading } from "@/components/face/FaceScanShell";

import { getUser } from "@/helpers/token.helper";

import { getErrorMessage } from "@/lib/face/errors";

import {

  getReferenceEmbeddings,

  hasValidProfilePhoto,

} from "@/lib/face/enrollment";

import {

  canCheckIn,

  canCheckOut,

  getTodayStatus,

  saveLocalAbsen,

} from "@/services/absen.service";

import type { AbsenType } from "@/types/absen";

import { router, useLocalSearchParams } from "expo-router";

import { useCallback, useEffect, useState } from "react";

import { Alert } from "react-native";



export default function AbsenScanPage() {

  const { type } = useLocalSearchParams<{ type?: string }>();

  const absenType: AbsenType = type === "OUT" ? "OUT" : "IN";



  const [loading, setLoading] = useState(true);

  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);

  const [referenceEmbeddings, setReferenceEmbeddings] = useState<
    number[][] | null
  >(null);

  const [userNik, setUserNik] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);



  const scanTitle = "Verifikasi Identitas";

  const scanSubtitle =

    absenType === "IN" ? "Presensi Masuk" : "Presensi Pulang";



  const prepare = useCallback(async () => {

    setLoading(true);

    setError(null);



    try {

      const user = await getUser();

      if (!user?.NIKSistag) {

        throw new Error("Data pengguna tidak ditemukan. Silakan login ulang.");

      }



      if (!hasValidProfilePhoto(user.Photo)) {

        Alert.alert(

          "Foto profil diperlukan",

          "Unggah foto wajah di profil terlebih dahulu untuk verifikasi absensi.",

          [

            { text: "Batal", onPress: () => router.back() },

            {

              text: "Ke Profil",

              onPress: () => router.replace("/page/edit-profile"),

            },

          ],

        );

        return;

      }



      const status = await getTodayStatus(user.NIKSistag);

      if (absenType === "IN" && !canCheckIn(status)) {

        throw new Error("Anda sudah melakukan presensi masuk hari ini.");

      }

      if (absenType === "OUT" && !canCheckOut(status)) {

        throw new Error("Presensi pulang belum dapat dilakukan.");

      }



      setUserNik(user.NIKSistag);

      const embeddings = await getReferenceEmbeddings(user.Photo, (progress) => {
        setDownloadPercent(progress.percent);
      });

      setReferenceEmbeddings(embeddings);

    } catch (err) {

      setError(getErrorMessage(err, "Gagal mempersiapkan verifikasi."));

    } finally {

      setLoading(false);

    }

  }, [absenType]);



  useEffect(() => {

    prepare();

  }, [prepare]);



  const handleVerified = useCallback(

    async (score: number) => {

      try {

        const user = await getUser();

        if (!user?.NIKSistag) {

          throw new Error("Data pengguna tidak ditemukan.");

        }



        await saveLocalAbsen(absenType, user.NIKSistag, score);



        Alert.alert(

          "Verifikasi Berhasil",

          absenType === "IN"

            ? `Presensi masuk tercatat. Kecocokan wajah ${Math.round(score * 100)}%.`

            : `Presensi pulang tercatat. Kecocokan wajah ${Math.round(score * 100)}%.`,

          [{ text: "OK", onPress: () => router.replace("/page/absen") }],

        );

      } catch (err) {

        const message =

          err instanceof Error ? err.message : "Gagal menyimpan absensi.";

        Alert.alert("Gagal", message);

      }

    },

    [absenType],

  );



  if (loading) {

    const downloading =

      downloadPercent != null && downloadPercent < 100;



    return (

      <FaceScanLoading

        title={downloading ? "Mengunduh Model AI" : "Mempersiapkan Verifikasi"}

        message={

          downloading

            ? "Model pengenalan wajah sedang diunduh ke perangkat Anda."

            : "Memuat referensi wajah dari foto profil..."

        }

        hint="Proses pertama kali mungkin membutuhkan beberapa menit."

        progress={downloading ? downloadPercent : null}

      />

    );

  }



  if (error || !referenceEmbeddings) {

    return (

      <FaceScanError

        title="Tidak Dapat Memulai Scan"

        message={error ?? "Referensi wajah tidak tersedia."}

        onRetry={prepare}

        onBack={() => router.back()}

      />

    );

  }



  return (

    <FaceScanner

      referenceEmbeddings={referenceEmbeddings}

      userNik={userNik ?? undefined}

      onVerified={handleVerified}

      onCancel={() => router.back()}

      title={scanTitle}

      subtitle={scanSubtitle}

    />

  );

}


