import { Injectable } from '@angular/core';
import { collection, collectionData, query, where, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BaseFirestoreService } from './base-firestore.service';
import type { Activity } from '../models/activity.model';

@Injectable({ providedIn: 'root' })
export class ActivitiesService extends BaseFirestoreService<Activity> {
  constructor() {
    super('activities');
  }

  /**
   * Stream activities for a specific pet, newest first.
   */
  listByPet$(petId: string): Observable<Activity[]> {
    const colRef = collection(this.firestore, this.collectionPath);
    const q = query(colRef, where('petId', '==', petId), orderBy('timestamp', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Activity[]>;
  }
}
