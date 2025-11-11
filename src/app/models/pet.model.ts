export type PetMode = 'Private' | 'Public';

export interface Pet {
  id: string;
  name: string;
  species: string;
  birthdate: string; // ISO date string
  mode: PetMode;
  description?: string;
  userId: string;
  createdAt: string; // ISO date string
  lastModify: string; // ISO date string
  photoUrl?: string;
}
