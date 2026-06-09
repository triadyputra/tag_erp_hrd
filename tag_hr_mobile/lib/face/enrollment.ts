import {

  readCachedEmbedding,

  writeCachedEmbedding,

} from "@/lib/face/enrollment-cache";

import { buildFaceEmbeddingVariants } from "@/lib/face/pipeline";

import { validateProfilePhotoForEnrollment } from "@/lib/face/profile-photo";

import { writePhotoToTempFile } from "@/lib/face/image-utils";

import { photoCacheKey } from "@/lib/face/math";

import { hasValidProfilePhoto } from "@/lib/face/profile";

import { syncEmbeddingToServer } from "@/lib/face/server-enrollment";

import type { ModelDownloadProgress } from "@/lib/face/arcface";

import { getUser } from "@/helpers/token.helper";



export { hasValidProfilePhoto };

export { clearFaceEmbedding } from "@/lib/face/enrollment-cache";



export async function enrollFromPhoto(

  photo: string,

  onDownloadProgress?: (progress: ModelDownloadProgress) => void,

): Promise<number[][]> {

  const trimmed = photo.trim();

  if (!hasValidProfilePhoto(trimmed)) {

    throw new Error("Foto profil belum diatur. Silakan unggah foto profil.");

  }



  const validation = await validateProfilePhotoForEnrollment(trimmed);

  if (!validation.valid) {

    throw new Error(validation.message);

  }



  const tempUri = await writePhotoToTempFile(trimmed);

  const embeddings = await buildFaceEmbeddingVariants(tempUri, onDownloadProgress);



  await writeCachedEmbedding(photoCacheKey(trimmed), embeddings);



  const user = await getUser();

  if (user?.NIKSistag) {

    await syncEmbeddingToServer(user.NIKSistag, embeddings);

  }



  return embeddings;

}



export async function getReferenceEmbeddings(

  photo: string,

  onDownloadProgress?: (progress: ModelDownloadProgress) => void,

): Promise<number[][]> {

  const trimmed = photo.trim();

  const key = photoCacheKey(trimmed);

  const cached = await readCachedEmbedding(key);

  if (cached) return cached;



  return enrollFromPhoto(trimmed, onDownloadProgress);

}



/** Backward-compatible single embedding accessor. */

export async function getReferenceEmbedding(

  photo: string,

  onDownloadProgress?: (progress: ModelDownloadProgress) => void,

): Promise<number[]> {

  const embeddings = await getReferenceEmbeddings(photo, onDownloadProgress);

  return embeddings[0];

}

