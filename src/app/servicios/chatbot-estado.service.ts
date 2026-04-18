import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FiltrosChatbot {
  ciudad?: string;
  departamento?: string;
  tipo?: string;
  tipoNegocio?: string;
  precioMin?: number;
  precioMax?: number;
  habitacionesMin?: number;
  banosMin?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatbotEstadoService {
  private filtrosSubject = new BehaviorSubject<FiltrosChatbot | null>(null);
  filtros$ = this.filtrosSubject.asObservable();

  aplicarFiltros(filtros: FiltrosChatbot): void {
    this.filtrosSubject.next(filtros);
  }

  consumirFiltros(): FiltrosChatbot | null {
    const f = this.filtrosSubject.value;
    this.filtrosSubject.next(null);
    return f;
  }
}
