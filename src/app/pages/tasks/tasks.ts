import { Component, inject, signal, computed } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { combineLatest, map, of, switchMap, catchError, startWith } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ResolutionService, Task, Resolution } from '../../services/resolution.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

export interface TaskWithResolution extends Task {
  resolutionName: string;
  resolutionColor: string;
}

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskWithResolution[];
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [AsyncPipe, DatePipe, TranslocoModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class Tasks {
  private resolutionService = inject(ResolutionService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private translocoService = inject(TranslocoService);

  user$ = this.authService.user$;

  // Vista actual: 'list' o 'calendar'
  viewMode = signal<'list' | 'calendar'>('list');

  // Mes y año para la vista calendario
  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());

  // Nombres de los días de la semana
  weekDays = computed(() => {
    const lang = this.translocoService.getActiveLang();
    if (lang === 'es') {
      return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    }
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  });

  // Nombre del mes actual
  currentMonthName = computed(() => {
    const date = new Date(this.currentYear(), this.currentMonth(), 1);
    const lang = this.translocoService.getActiveLang();
    return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });
  });

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
            resolutionName: resolution.name,
            resolutionColor: resolution.color || '#1a73e8'
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

  toggleView() {
    this.viewMode.update(v => v === 'list' ? 'calendar' : 'list');
  }

  previousMonth() {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
  }

  nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
  }

  goToToday() {
    const today = new Date();
    this.currentMonth.set(today.getMonth());
    this.currentYear.set(today.getFullYear());
  }

  generateCalendarDays(tasks: TaskWithResolution[]): CalendarDay[] {
    const year = this.currentYear();
    const month = this.currentMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Obtener el día de la semana del primer día (0=Domingo, ajustamos para Lunes=0)
    let firstWeekday = firstDayOfMonth.getDay() - 1;
    if (firstWeekday < 0) firstWeekday = 6; // Domingo
    
    const daysInMonth = lastDayOfMonth.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days: CalendarDay[] = [];
    
    // Días del mes anterior
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, daysInPrevMonth - i);
      days.push({
        date,
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
        tasks: this.getTasksForDate(tasks, date)
      });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.getTime() === today.getTime();
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday,
        tasks: this.getTasksForDate(tasks, date)
      });
    }
    
    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(nextYear, nextMonth, day);
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: false,
        tasks: this.getTasksForDate(tasks, date)
      });
    }
    
    return days;
  }

  private getTasksForDate(tasks: TaskWithResolution[], date: Date): TaskWithResolution[] {
    const dateStr = this.formatDateToCompare(date);
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return task.dueDate === dateStr;
    });
  }

  private formatDateToCompare(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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
