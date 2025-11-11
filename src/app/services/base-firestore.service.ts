import { inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  setDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

/**
 * Minimal reusable base service for a Firestore collection.
 *
 * Usage:
 *  - Create a typed service that extends this base class, e.g.:
 *      @Injectable({ providedIn: 'root' })
 *      export class PetsService extends BaseFirestoreService<Pet> {
 *        constructor(){ super('pets'); }
 *      }
 *
 * Methods return Observables for live data and Promises for writes.
 */
export abstract class BaseFirestoreService<T extends { id?: string } = any> {
  protected readonly firestore = inject(Firestore);
  protected readonly collectionPath: string;

  constructor(collectionPath: string) {
    this.collectionPath = collectionPath;
  }

  /** Observable of all documents in the collection (real-time). */
  list$(): Observable<T[]> {
    const col = collection(this.firestore, this.collectionPath);
    return collectionData(col, { idField: 'id' }) as Observable<T[]>;
  }

  /** Observable of a single document by id (real-time). */
  doc$(id: string): Observable<T | undefined> {
    const d = doc(this.firestore, `${this.collectionPath}/${id}`);
    return docData(d, { idField: 'id' }) as Observable<T | undefined>;
  }

  /** Add a new document to the collection. Returns the created DocumentReference promise. */
  add(item: Partial<T>): Promise<any> {
    const col = collection(this.firestore, this.collectionPath);
    return addDoc(col, item as any);
  }

  /** Update (merge) fields on an existing document. */
  update(id: string, data: Partial<T>): Promise<void> {
    const d = doc(this.firestore, `${this.collectionPath}/${id}`);
    return setDoc(d, data as any, { merge: true });
  }

  /** Delete a document by id. */
  delete(id: string): Promise<void> {
    const d = doc(this.firestore, `${this.collectionPath}/${id}`);
    return deleteDoc(d);
  }
}
