import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ThemeService, Theme } from '../../services/theme.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-configuration',
  imports: [TranslocoModule],
  templateUrl: './configuration.html',
  styleUrl: './configuration.scss',
})
export class Configuration {
  translocoService = inject(TranslocoService);
  private themeService = inject(ThemeService);
  private http = inject(HttpClient);
  private taskService = inject(TaskService);

  availableLangs = ['es', 'en'];
  activeLang = signal(this.translocoService.getActiveLang());
  
  themes: Theme[] = ['light', 'dark', 'system'];
  activeTheme = this.themeService.theme;

  /** Si es false, se oculta la sección de carga de tareas desde JSON. */
  showLoadTasksSection = signal(false);

  loadingTasks = signal(false);

  changeLang(lang: string) {
    this.translocoService.setActiveLang(lang);
    this.activeLang.set(lang);
    localStorage.setItem('preferredLang', lang);
  }

  changeTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  getLangLabel(lang: string): string {
    return this.translocoService.translate('languages.' + lang);
  }

  async loadTasksFromJson(): Promise<void> {
    this.loadingTasks.set(true);
    try {
      const tasks = await this.http.get<Array<{
        resolutionId: string;
        description?: string;
        dueDate?: string;
        completed?: boolean;
        createdAt?: string;
      }>>('assets/carga/tareas.json').toPromise();

      if (!tasks || tasks.length === 0) {
        alert(this.translocoService.translate('settings.loadTasksError', { error: 'El archivo está vacío o no es un array.' }));
        return;
      }

      const result = await this.taskService.loadTasksFromJsonFile(tasks);

      if (result.success) {
        alert(this.translocoService.translate('settings.loadTasksSuccess', { count: result.count }));
      } else {
        alert(this.translocoService.translate('settings.loadTasksError', { error: result.error ?? 'Error desconocido' }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert(this.translocoService.translate('settings.loadTasksError', { error: message }));
    } finally {
      this.loadingTasks.set(false);
    }
  }
}
