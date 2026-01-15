import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, of, switchMap } from 'rxjs';
import { user } from '@angular/fire/auth';

export interface Resolution {
  id?: string;
  userId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string | null;
  completed: boolean;
  completedAt?: Timestamp;
  order: number;
  createdAt: Timestamp;
}

export interface Task {
  id?: string;
  resolutionId: string;
  description: string;
  completed: boolean;
  dueDate?: string; // Fecha límite de la tarea
  createdAt: Timestamp;
}

export interface ResolutionWithProgress extends Resolution {
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResolutionService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private platformId = inject(PLATFORM_ID);

  private readonly collectionName = 'resolutions';

  getResolutions$(): Observable<Resolution[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    return user(this.auth).pipe(
      switchMap(currentUser => {
        if (!currentUser) {
          return of([]);
        }
        const resolutionsRef = collection(this.firestore, this.collectionName);
        const q = query(
          resolutionsRef,
          where('userId', '==', currentUser.uid),
          orderBy('order', 'asc')
        );
        return collectionData(q, { idField: 'id' }) as Observable<Resolution[]>;
      })
    );
  }

  async addResolution(data: Omit<Resolution, 'id' | 'userId' | 'createdAt' | 'completed' | 'order'>): Promise<string> {
    if (!isPlatformBrowser(this.platformId)) return '';

    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const resolutionsRef = collection(this.firestore, this.collectionName);
    const docRef = await addDoc(resolutionsRef, {
      ...data,
      userId: currentUser.uid,
      completed: false,
      order: Date.now(), // Nuevos propósitos van al final
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }

  async updateResolutionsOrder(resolutions: { id: string; order: number }[]): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const batch = writeBatch(this.firestore);
    
    resolutions.forEach(({ id, order }) => {
      const docRef = doc(this.firestore, this.collectionName, id);
      batch.update(docRef, { order });
    });

    await batch.commit();
  }

  async updateResolution(id: string, data: Partial<Pick<Resolution, 'name' | 'description' | 'startDate' | 'endDate'>>): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const docRef = doc(this.firestore, this.collectionName, id);
    await updateDoc(docRef, data);
  }

  async completeResolution(id: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const docRef = doc(this.firestore, this.collectionName, id);
    await updateDoc(docRef, {
      completed: true,
      completedAt: Timestamp.now()
    });
  }

  async deleteResolution(id: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
