import { Component, output, input, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Resolution, Task } from '../../services/resolution.service';
import { TaskService } from '../../services/task.service';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface TaskWithDate {
  description: string;
  dueDate?: string;
}

export interface ResolutionFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  tasks: TaskWithDate[];
}

export interface ResolutionUpdateData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  newTasks: TaskWithDate[];
}

@Component({
  selector: 'app-modal-add-resolution',
  standalone: true,
  imports: [FormsModule, AsyncPipe, DatePipe],
  templateUrl: './modal-add-resolution.html',
  styleUrl: './modal-add-resolution.scss',
})
export class ModalAddResolution implements OnInit {
  private taskService = inject(TaskService);

  close = output<void>();
  save = output<ResolutionFormData>();
  update = output<ResolutionUpdateData>();
  complete = output<string>(); // Emite el ID de la resolución a completar

  // Inputs para modo vista
  viewMode = input<boolean>(false);
  resolutionData = input<Resolution | null>(null);

  // Estado interno para edición
  editMode = signal(false);

  resolution = {
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  };

  // Tareas locales para modo creación/edición
  pendingTasks = signal<TaskWithDate[]>([]);
  newTaskDescription = signal('');
  newTaskDueDate = signal<string>('');

  // Tareas de Firestore para modo vista/edición
  tasks$: Observable<Task[]> = of([]);
  
  // Para saber si se puede completar
  canComplete = signal(false);
  private tasksSnapshot: Task[] = [];

  ngOnInit() {
    const data = this.resolutionData();
    if (this.viewMode() && data) {
      this.resolution = {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate || ''
      };
      if (data.id) {
        this.tasks$ = this.taskService.getTasksByResolution$(data.id).pipe(
          map(tasks => {
            return [...tasks].sort((a, b) => {
              const aHas = !!a.dueDate;
              const bHas = !!b.dueDate;

              // Ambas con fecha: ascendente por dueDate
              if (aHas && bHas) {
                return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
              }
              // Solo una con fecha: la que tiene fecha va antes
              if (aHas && !bHas) return -1;
              if (!aHas && bHas) return 1;

              // Ninguna con fecha: desempata por createdAt (ascendente)
              const aMs = a.createdAt?.toMillis?.() ?? ((a.createdAt as any)?.seconds ?? 0) * 1000;
              const bMs = b.createdAt?.toMillis?.() ?? ((b.createdAt as any)?.seconds ?? 0) * 1000;
              return aMs - bMs;
            });
          }),
          tap(tasks => {
            this.tasksSnapshot = tasks;
            // Se puede completar si no tiene tareas o todas están completadas
            const canComplete = tasks.length === 0 || tasks.every(t => t.completed);
            this.canComplete.set(canComplete);
          })
        );
      } else {
        // Sin tareas, se puede completar
        this.canComplete.set(true);
      }
    }
  }

  onClose() {
    this.editMode.set(false);
    this.close.emit();
  }

  onSave() {
    if (this.resolution.name && this.resolution.startDate) {
      this.save.emit({
        ...this.resolution,
        tasks: this.pendingTasks()
      });
      this.onClose();
    }
  }

  onUpdate() {
    const data = this.resolutionData();
    if (this.resolution.name && this.resolution.startDate && data?.id) {
      this.update.emit({
        id: data.id,
        ...this.resolution,
        newTasks: this.pendingTasks()
      });
      this.onClose();
    }
  }

  enterEditMode() {
    this.editMode.set(true);
    this.pendingTasks.set([]);
    this.newTaskDescription.set('');
  }

  cancelEdit() {
    this.editMode.set(false);
    this.pendingTasks.set([]);
    this.newTaskDescription.set('');
    this.newTaskDueDate.set('');
  }

  addTask() {
    const desc = this.newTaskDescription().trim();
    if (desc) {
      const dueDate = this.newTaskDueDate() || undefined;
      this.pendingTasks.update(tasks => [...tasks, { description: desc, dueDate }]);
      this.newTaskDescription.set('');
      this.newTaskDueDate.set('');
    }
  }

  removeTask(index: number) {
    this.pendingTasks.update(tasks => tasks.filter((_, i) => i !== index));
  }

  openDatePicker(event: Event) {
    const target = event.target as HTMLElement;
    const dateInput = target.closest('.add-task-row')?.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) {
      dateInput.showPicker();
    }
  }

  getMinDate(): string {
    return this.resolution.startDate || '';
  }

  getMaxDate(): string {
    return this.resolution.endDate || '';
  }

  async toggleTaskCompleted(task: Task) {
    if (task.id) {
      await this.taskService.toggleTaskCompleted(task.id, !task.completed);
    }
  }

  async deleteTask(task: Task) {
    if (task.id) {
      await this.taskService.deleteTask(task.id);
    }
  }

  onComplete() {
    const data = this.resolutionData();
    if (data?.id && this.canComplete()) {
      this.complete.emit(data.id);
      this.onClose();
    } else if (!this.canComplete()) {
      alert('Debes completar todas las tareas antes de marcar el propósito como completado.');
    }
  }

  isResolutionCompleted(): boolean {
    const data = this.resolutionData();
    return data?.completed ?? false;
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }
}
