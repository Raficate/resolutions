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

    const BATCH_SIZE = 500;
    const tasksRef = collection(this.firestore, this.collectionName);

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.firestore);
      const chunk = tasks.slice(i, i + BATCH_SIZE);

      for (const task of chunk) {
        const docRef = doc(tasksRef);
        const taskData: Record<string, unknown> = {
          resolutionId,
          description: task.description ?? '',
          completed: false,
          createdAt: Timestamp.now()
        };
        if (task.dueDate) {
          taskData['dueDate'] = task.dueDate;
        }
        batch.set(docRef, taskData);
      }

      await batch.commit();
    }
  }

  /**
   * Carga tareas masivamente desde un array (p. ej. leído de assets/carga/tareas.json).
   * Cada tarea puede tener resolutionId, description, dueDate, completed, createdAt (ISO string).
   */
  async loadTasksFromJsonFile(
    tasks: Array<{
      resolutionId: string;
      description?: string;
      dueDate?: string;
      completed?: boolean;
      createdAt?: string;
    }>
  ): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isPlatformBrowser(this.platformId)) {
      return { success: false, count: 0, error: 'No disponible en servidor' };
    }
    if (!tasks || tasks.length === 0) {
      return { success: false, count: 0, error: 'El array de tareas está vacío' };
    }

    const invalid = tasks.filter(t => !t.resolutionId || typeof t.resolutionId !== 'string');
    if (invalid.length > 0) {
      return { success: false, count: 0, error: 'Algunas tareas no tienen resolutionId válido' };
    }

    const BATCH_SIZE = 500;
    const tasksRef = collection(this.firestore, this.collectionName);

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = writeBatch(this.firestore);
      const chunk = tasks.slice(i, i + BATCH_SIZE);

      for (const task of chunk) {
        const docRef = doc(tasksRef);
        let createdAt: Timestamp;
        if (task.createdAt && task.createdAt.trim()) {
          const date = new Date(task.createdAt);
          if (!isNaN(date.getTime())) {
            createdAt = Timestamp.fromDate(date);
          } else {
            createdAt = Timestamp.now();
          }
        } else {
          createdAt = Timestamp.now();
        }

        const taskData: Record<string, unknown> = {
          resolutionId: task.resolutionId,
          description: task.description ?? '',
          completed: task.completed ?? false,
          createdAt
        };
        if (task.dueDate != null && task.dueDate !== '') {
          taskData['dueDate'] = task.dueDate;
        }
        batch.set(docRef, taskData);
      }

      await batch.commit();
    }

    return { success: true, count: tasks.length };
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
