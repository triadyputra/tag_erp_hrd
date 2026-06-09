import { detectFaceInImage } from "@/lib/face/pipeline";
import { writePhotoToTempFile } from "@/lib/face/image-utils";
import { hasValidProfilePhoto } from "@/lib/face/profile";

export type ProfilePhotoValidation = {
  valid: boolean;
  message: string;
};

export async function validateProfilePhotoForEnrollment(
  photo: string,
): Promise<ProfilePhotoValidation> {
  const trimmed = photo.trim();
  if (!hasValidProfilePhoto(trimmed)) {
    return {
      valid: false,
      message: "Foto profil tidak valid.",
    };
  }

  try {
    const tempUri = await writePhotoToTempFile(trimmed);
    await detectFaceInImage(tempUri);
    return {
      valid: true,
      message: "Foto wajah valid untuk verifikasi absensi.",
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Wajah tidak terdeteksi pada foto.";
    return {
      valid: false,
      message: `${message} Gunakan selfie frontal dengan pencahayaan cukup.`,
    };
  }
}
