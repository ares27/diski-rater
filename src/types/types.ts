// src/types.ts
export interface Player {
  _id?: string;
  id: string;
  name: string;
  diskiName: string; // Added
  area: string; // Added
  position: "GK" | "DEF" | "MID" | "FWD";
  ratings: {
    technical: number;
    pace: number;
    physical: number;
    reliability: number;
  };
  isSelected?: boolean;
}

export interface UserProfile {
  firebaseUid: string;
  diskiName: string;
  phoneNumber: string;
  area: string;
  role: "Player" | "Captain" | "Admin";
  status: "Pending" | "Approved" | "Rejected";
}
