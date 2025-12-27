// src/types.ts
export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  ratings: {
    technical: number;
    pace: number;
    physical: number;
    reliability: number;
  };
  isSelected?: boolean; 
}