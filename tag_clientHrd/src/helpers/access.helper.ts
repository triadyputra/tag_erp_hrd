export interface AccessItem {
  subject: string;
  action: string;
}

export function getAuthAccess(): AccessItem[] {
  try {
    const raw = localStorage.getItem("auth_access");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
