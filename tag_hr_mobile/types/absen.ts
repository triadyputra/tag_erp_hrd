export type AbsenType = "IN" | "OUT";

export type AbsenRecord = {
  id: string;
  type: AbsenType;
  timestamp: string;
  localScore: number;
  verified: boolean;
  nik: string;
};

export type TodayAbsenStatus = {
  checkIn: AbsenRecord | null;
  checkOut: AbsenRecord | null;
};
