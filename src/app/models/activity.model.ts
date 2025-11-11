export interface Activity {
  id: string;
  petId: string;
  type: string; // e.g., Walk, Vet Visit, Feeding
  notes?: string;
  timestamp: string; // ISO date string
  userId: string; // uid of the pet owner/creator
}
