export type StatusType = "active" | "upcoming" | "inactive";

export function getDateStatus(
  start?: string | Date,
  end?: string | Date,
): StatusType {
  if (!start || !end) return "inactive";

  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);

  if (now >= s && now <= e) return "active";
  if (now < s) return "upcoming";

  return "inactive";
}

export function getStatusLabel(status: StatusType) {
  switch (status) {
    case "active":
      return "Aktif";
    case "upcoming":
      return "Akan Aktif";
    default:
      return "Non Aktif";
  }
}

export function getStatusColor(status: StatusType) {
  switch (status) {
    case "active":
      return { bg: "#DCFCE7", text: "#16A34A" };
    case "upcoming":
      return { bg: "#DBEAFE", text: "#2563EB" };
    default:
      return { bg: "#FEE2E2", text: "#DC2626" };
  }
}
