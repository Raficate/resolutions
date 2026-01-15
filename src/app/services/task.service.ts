import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  getDocs
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { Task } from './resolution.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore = inject(Firestore);
  private platformId = inject(PLATFORM_ID);

  private readonly collectionName = 'tasks';

  getTasksByResolution$(resolutionId: string): Observable<Task[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    const tasksRef = collection(this.firestore, this.collectionName);
    const q = query(
      tasksRef,
      where('resolutionId', '==', resolutionId),
      orderBy('createdAt', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Task[]>;
  }

  async addTask(resolutionId: string, description: string): Promise<string> {
    if (!isPlatformBrowser(this.platformId)) return '';

    const tasksRef = collection(this.firestore, this.collectionName);
    const docRef = await addDoc(tasksRef, {
      resolutionId,
      description,
      completed: false,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  }

  async addMultipleTasks(resolutionId: string, tasks: Array<{ description: string; dueDate?: string }>): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (tasks.length === 0) return;

    const batch = writeBatch(this.firestore);
    const tasksRef = collection(this.firestore, this.collectionName);

    for (const task of tasks) {
      const docRef = doc(tasksRef);
      const taskData: any = {
        resolutionId,
        description: task.description,
        completed: false,
        createdAt: Timestamp.now()
      };
      if (task.dueDate) {
        taskData.dueDate = task.dueDate;
      }
      batch.set(docRef, taskData);
    }

    await batch.commit();
  }

  async toggleTaskCompleted(taskId: string, completed: boolean): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const docRef = doc(this.firestore, this.collectionName, taskId);
    await updateDoc(docRef, { completed });
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const docRef = doc(this.firestore, this.collectionName, taskId);
    await deleteDoc(docRef);
  }

  async deleteTasksByResolution(resolutionId: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const tasksRef = collection(this.firestore, this.collectionName);
      const q = query(tasksRef, where('resolutionId', '==', resolutionId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const batch = writeBatch(this.firestore);
        snapshot.docs.forEach(docSnapshot => {
          batch.delete(docSnapshot.ref);
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Error eliminando tareas:', error);
    }
  }
}
