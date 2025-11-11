import { Injectable } from '@angular/core';
import { query, where, collectionData, collection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BaseFirestoreService } from './base-firestore.service';
import type { Pet } from '../models/pet.model';

@Injectable({ providedIn: 'root' })
export class PetsService extends BaseFirestoreService<Pet> {
  constructor() {
    super('pets');
  }

  /**
   * Observable stream of only public pets (server-side filtered).
   * This uses a Firestore query so the filtering happens on the backend.
   */
  listPublic$(): Observable<Pet[]> {
    const colRef = collection(this.firestore, this.collectionPath);
    const q = query(colRef, where('mode', '==', 'Public'));
    return collectionData(q, { idField: 'id' }) as Observable<Pet[]>;
  }

  /**
   * Observable stream of pets that belong to a specific userId.
   * Useful for dashboards showing the current user's pets.
   */
  listByUser$(userId: string): Observable<Pet[]> {
    const colRef = collection(this.firestore, this.collectionPath);
    const q = query(colRef, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Pet[]>;
  }
}
