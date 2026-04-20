import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PanelActivo = 'chatbot' | 'chatbot-ia' | 'accesibilidad' | null;

@Injectable({ providedIn: 'root' })
export class PanelService {
  private panelActivo$ = new BehaviorSubject<PanelActivo>(null);
  private modalAbierto$ = new BehaviorSubject<boolean>(false);

  panel$ = this.panelActivo$.asObservable();
  modal$ = this.modalAbierto$.asObservable();

  abrir(panel: PanelActivo) {
    const actual = this.panelActivo$.getValue();
    this.panelActivo$.next(actual === panel ? null : panel);
  }

  cerrar() { this.panelActivo$.next(null); }

  abrirModal() {
    this.panelActivo$.next(null); // cierra cualquier panel abierto
    this.modalAbierto$.next(true);
  }

  cerrarModal() { this.modalAbierto$.next(false); }
}
