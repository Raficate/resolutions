import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Convierte saltos de línea (\n, \r\n) en <br> para mostrarlos en HTML.
 * Escapa el resto del contenido para evitar XSS.
 */
@Pipe({ name: 'newlineToBr', standalone: true })
export class NewlineToBrPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (value == null || value === '') {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    const withBr = escaped.replace(/\r?\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(withBr);
  }
}
