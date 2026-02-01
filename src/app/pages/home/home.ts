import { Component, signal, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, map, of, switchMap, catchError, startWith } from 'rxjs';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragHandle, moveItemInArray } from '@angular/cdk/drag-drop';
import { Timestamp } from '@angular/fire/firestore';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ModalAddResolution, ResolutionFormData, ResolutionUpdateData } from '../../components/modal-add-resolution/modal-add-resolution';
import { ResolutionService, Resolution, ResolutionWithProgress } from '../../services/resolution.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { ResolutionSearchService } from '../../services/resolution-search.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ModalAddResolution, AsyncPipe, DatePipe, CdkDropList, CdkDrag, CdkDragHandle, TranslocoModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private resolutionService = inject(ResolutionService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private searchService = inject(ResolutionSearchService);

  showModal = signal(false);
  viewMode = signal(false);
  selectedResolution = signal<Resolution | null>(null);

  user$ = this.authService.user$;

  private searchTerm$ = toObservable(this.searchService.searchTerm);

  // Combinar resoluciones con el progreso de tareas
  private resolutionsWithProgressRaw$ = this.resolutionService.getResolutions$().pipe(
    switchMap(resolutions => {
      if (resolutions.length === 0) {
        return of([]);
      }

      const resolutionsWithTasks$ = resolutions.map(resolution =>
        this.taskService.getTasksByResolution$(resolution.id!).pipe(
          startWith([]),
          catchError(() => of([])),
          map(tasks => ({
            ...resolution,
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.completed).length,
            progress: tasks.length > 0
              ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
              : 0
          } as ResolutionWithProgress))
        )
      );

      return combineLatest(resolutionsWithTasks$);
    }),
    catchError(error => {
      console.error('Error cargando resoluciones:', error);
      return of([]);
    })
  );

  /** Propósitos filtrados por nombre o descripción. Usado en la plantilla. */
  public resolutionsWithProgress$ = combineLatest([
    this.resolutionsWithProgressRaw$,
    this.searchTerm$
  ]).pipe(
    map(([resolutions, term]) => {
      if (!term) return resolutions;
      const lower = term.toLowerCase();
      return resolutions.filter(
        r =>
          (r.name || '').toLowerCase().includes(lower) ||
          (r.description || '').toLowerCase().includes(lower)
      );
    })
  );

  openModal() {
    this.viewMode.set(false);
    this.selectedResolution.set(null);
    this.showModal.set(true);
  }

  openViewModal(resolution: Resolution) {
    this.viewMode.set(true);
    this.selectedResolution.set(resolution);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.viewMode.set(false);
    this.selectedResolution.set(null);
  }

  async saveResolution(data: ResolutionFormData) {
    const { tasks, ...resolutionData } = data;
    const resolutionId = await this.resolutionService.addResolution(resolutionData);
    
    if (resolutionId && tasks.length > 0) {
      await this.taskService.addMultipleTasks(resolutionId, tasks);
    }
    
    this.closeModal();
  }

  async updateResolution(data: ResolutionUpdateData) {
    try {
      const { id, newTasks, ...resolutionData } = data;
      
      await this.resolutionService.updateResolution(id, {
        name: resolutionData.name,
        description: resolutionData.description,
        startDate: resolutionData.startDate,
        endDate: resolutionData.endDate || null,
        color: resolutionData.color
      });
      
      if (newTasks.length > 0) {
        await this.taskService.addMultipleTasks(id, newTasks);
      }
      
      this.closeModal();
    } catch (error) {
      console.error('Error actualizando propósito:', error);
    }
  }

  async deleteResolution(id: string, event: Event) {
    event.stopPropagation();
    
    if (confirm('¿Estás seguro de que quieres eliminar este propósito y todas sus tareas?')) {
      try {
        await this.taskService.deleteTasksByResolution(id);
        await this.resolutionService.deleteResolution(id);
      } catch (error) {
        console.error('Error eliminando propósito:', error);
      }
    }
  }

  getProgressColorClass(progress: number): string {
    if (progress < 25) return 'progress-red';
    if (progress < 50) return 'progress-orange';
    if (progress < 75) return 'progress-yellow';
    return 'progress-green';
  }

  async completeResolutionById(id: string) {
    if (confirm('¿Marcar este propósito como completado?')) {
      try {
        await this.resolutionService.completeResolution(id);
        this.closeModal();
      } catch (error) {
        console.error('Error completando propósito:', error);
      }
    }
  }

  async drop(event: CdkDragDrop<ResolutionWithProgress[]>, resolutions: ResolutionWithProgress[]) {
    if (event.previousIndex === event.currentIndex) return;

    // Crear copia del array para manipular
    const reorderedResolutions = [...resolutions];
    moveItemInArray(reorderedResolutions, event.previousIndex, event.currentIndex);

    // Preparar actualizaciones con nuevos órdenes
    const updates = reorderedResolutions.map((res, index) => ({
      id: res.id!,
      order: index
    }));

    try {
      await this.resolutionService.updateResolutionsOrder(updates);
    } catch (error) {
      console.error('Error reordenando propósitos:', error);
    }
  }

  formatDate(timestamp: Timestamp): string {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
