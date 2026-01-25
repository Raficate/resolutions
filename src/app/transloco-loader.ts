import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

// Traducciones inline para SSR (prerendering)
const translations: Record<string, Translation> = {
  es: {
    header: {
      title: 'Mis propósitos de año nuevo',
      logout: 'Cerrar sesión',
      login: 'Iniciar sesión',
      language: 'Idioma'
    },
    sidebar: {
      home: 'Principal',
      tasks: 'Todas las tareas',
      calendar: 'Calendario',
      settings: 'Configuración'
    },
    settings: {
      title: 'Configuración',
      appearance: 'Apariencia',
      language: 'Idioma',
      languageDescription: 'Selecciona el idioma de la aplicación',
      theme: 'Tema',
      themeDescription: 'Selecciona el tema de la aplicación',
      themeLight: 'Claro',
      themeDark: 'Oscuro',
      themeSystem: 'Sistema'
    },
    home: {
      empty: 'Aquí comenzaremos a listar tus propósitos de año nuevo.',
      loginRequired: 'Inicia sesión para ver y crear tus propósitos de año nuevo.',
      startDate: 'Inicio',
      endDate: 'Fin estimado',
      completedAt: 'Finalizado',
      addResolution: 'Añadir propósito'
    },
    tasks: {
      title: 'Todas las tareas',
      empty: 'No tienes tareas creadas todavía.',
      emptyHint: 'Crea propósitos y añádeles tareas para verlas aquí.',
      noDueDate: 'Sin fecha límite',
      loginRequired: 'Inicia sesión para ver tus tareas.',
      calendarView: 'Vista calendario',
      listView: 'Vista lista',
      today: 'Hoy'
    },
    calendar: {
      title: 'Calendario de Propósitos',
      empty: 'No hay propósitos para mostrar.',
      emptyHint: 'Crea propósitos desde la página Principal para verlos aquí.',
      resolution: 'Propósito',
      today: 'Hoy',
      loginRequired: 'Inicia sesión para ver el calendario de tus propósitos.'
    },
    modal: {
      newResolution: 'Nuevo Propósito',
      editResolution: 'Editar Propósito',
      name: 'Nombre del propósito',
      namePlaceholder: 'Ej. Aprender Angular',
      description: 'Descripción',
      descriptionPlaceholder: '¿Por qué es importante para ti?',
      startDate: 'Fecha de inicio',
      endDate: 'Fecha de fin previsto',
      color: 'Color identificativo',
      tasks: 'Tareas',
      existingTasks: 'Tareas existentes',
      addNewTasks: 'Añadir nuevas tareas',
      tasksHint: 'Añade tareas para medir el progreso de tu propósito',
      taskPlaceholder: 'Descripción de la tarea',
      addTask: 'Añadir tarea',
      add: 'Añadir',
      dueDate: 'Fecha límite',
      noDueDate: 'Sin fecha límite',
      noTasks: 'Este propósito no tiene tareas definidas.',
      noTasksEdit: 'Este propósito no tiene tareas.',
      save: 'Guardar Propósito',
      saveChanges: 'Guardar cambios',
      cancel: 'Cancelar',
      close: 'Cerrar',
      edit: 'Editar',
      delete: 'Eliminar',
      complete: 'Completar',
      completeAllFirst: 'Completa todas las tareas primero'
    },
    languages: {
      es: 'Español',
      en: 'English'
    }
  },
  en: {
    header: {
      title: 'My year resolutions',
      logout: 'Log out',
      login: 'Sign in',
      language: 'Language'
    },
    sidebar: {
      home: 'Home',
      tasks: 'All tasks',
      calendar: 'Calendar',
      settings: 'Settings'
    },
    settings: {
      title: 'Settings',
      appearance: 'Appearance',
      language: 'Language',
      languageDescription: 'Select the application language',
      theme: 'Theme',
      themeDescription: 'Select the application theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeSystem: 'System'
    },
    home: {
      empty: 'Here we will start listing your new year resolutions.',
      loginRequired: 'Sign in to view and create your new year resolutions.',
      startDate: 'Start',
      endDate: 'Estimated end',
      completedAt: 'Completed',
      addResolution: 'Add resolution'
    },
    tasks: {
      title: 'All tasks',
      empty: "You don't have any tasks yet.",
      emptyHint: 'Create resolutions and add tasks to see them here.',
      noDueDate: 'No due date',
      loginRequired: 'Sign in to view your tasks.',
      calendarView: 'Calendar view',
      listView: 'List view',
      today: 'Today'
    },
    calendar: {
      title: 'Resolutions Calendar',
      empty: 'No resolutions to display.',
      emptyHint: 'Create resolutions from the Home page to see them here.',
      resolution: 'Resolution',
      today: 'Today',
      loginRequired: 'Sign in to view your resolutions calendar.'
    },
    modal: {
      newResolution: 'New Resolution',
      editResolution: 'Edit Resolution',
      name: 'Resolution name',
      namePlaceholder: 'E.g. Learn Angular',
      description: 'Description',
      descriptionPlaceholder: 'Why is it important to you?',
      startDate: 'Start date',
      endDate: 'Estimated end date',
      color: 'Identifying color',
      tasks: 'Tasks',
      existingTasks: 'Existing tasks',
      addNewTasks: 'Add new tasks',
      tasksHint: 'Add tasks to measure your resolution progress',
      taskPlaceholder: 'Task description',
      addTask: 'Add task',
      add: 'Add',
      dueDate: 'Due date',
      noDueDate: 'No due date',
      noTasks: 'This resolution has no tasks defined.',
      noTasksEdit: 'This resolution has no tasks.',
      save: 'Save Resolution',
      saveChanges: 'Save changes',
      cancel: 'Cancel',
      close: 'Close',
      edit: 'Edit',
      delete: 'Delete',
      complete: 'Complete',
      completeAllFirst: 'Complete all tasks first'
    },
    languages: {
      es: 'Español',
      en: 'English'
    }
  }
};

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  getTranslation(lang: string) {
    // En SSR, usar traducciones inline para evitar peticiones HTTP
    if (!isPlatformBrowser(this.platformId)) {
      return of(translations[lang] || translations['es']);
    }
    // En el browser, cargar desde archivos JSON
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}
