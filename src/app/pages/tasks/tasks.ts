import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { combineLatest, map, of, switchMap, catchError, startWith } from 'rxjs';
import { ResolutionService, Task, Resolution } from '../../services/resolution.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

export interface TaskWithResolution extends Task {
  resolutionName: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class Tasks {
  private resolutionService = inject(ResolutionService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  user$ = this.authService.user$;

  // Obtener todas las tareas de todas las resoluciones del usuario
  allTasks$ = this.resolutionService.getResolutions$().pipe(
    switchMap(resolutions => {
      if (resolutions.length === 0) {
        return of([]);
      }

      const tasksPerResolution$ = resolutions.map(resolution =>
        this.taskService.getTasksByResolution$(resolution.id!).pipe(
          startWith([]),
          catchError(() => of([])),
          map(tasks => tasks.map(task => ({
            ...task,
            resolutionName: resolution.name
          } as TaskWithResolution)))
        )
      );

      return combineLatest(tasksPerResolution$).pipe(
        map(taskArrays => {
          // Aplanar el array de arrays y ordenar por fecha límite
          const allTasks = taskArrays.flat();
          return allTasks.sort((a, b) => {
            // Primero las no completadas
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1;
            }
            // Luego por fecha límite (las que tienen fecha primero)
            const aHas = !!a.dueDate;
            const bHas = !!b.dueDate;
            if (aHas && bHas) {
              return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
            }
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;
            return 0;
          });
        })
      );
    }),
    catchError(error => {
      console.error('Error cargando tareas:', error);
      return of([]);
    })
  );

  async toggleTask(task: TaskWithResolution) {
    if (task.id) {
      await this.taskService.toggleTaskCompleted(task.id, !task.completed);
    }
  }

  isOverdue(task: TaskWithResolution): boolean {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }
}
