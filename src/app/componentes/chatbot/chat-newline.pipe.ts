import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convierte \n en <br> para mostrarlo en innerHTML del chatbot.
 * Uso: {{ mensaje | chatNewline }}
 */
@Pipe({ name: 'chatNewline', standalone: true })
export class ChatNewlinePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    // Escapa HTML básico para seguridad, luego convierte \n
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/\n/g, '<br>');
  }
}
