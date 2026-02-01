import { Injectable, signal } from '@angular/core';

/**
 * Servicio global para el término de búsqueda de propósitos.
 * El header escribe y la página home filtra por nombre o descripción.
 */
@Injectable({ providedIn: 'root' })
export class ResolutionSearchService {
  private _searchTerm = signal('');

  searchTerm = this._searchTerm.asReadonly();

  setSearchTerm(value: string) {
    this._searchTerm.set(value?.trim() ?? '');
  }

  clearSearch() {
    this._searchTerm.set('');
  }
}
