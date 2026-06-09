export function formatDate(val?: string | Date) {
  if (!val) return "-";

  try {
    return new Date(val).toLocaleDateString("id-ID");
  } catch {
    return "-";
  }
}
