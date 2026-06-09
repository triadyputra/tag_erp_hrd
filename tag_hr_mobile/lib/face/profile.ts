export function hasValidProfilePhoto(
  photo: string | null | undefined,
): boolean {
  const trimmed = typeof photo === "string" ? photo.trim() : "";
  return !!trimmed && trimmed.toLowerCase() !== "null";
}
