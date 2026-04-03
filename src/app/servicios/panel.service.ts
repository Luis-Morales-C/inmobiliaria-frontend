import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PanelActivo = 'chatbot' | 'accesibilidad' | null;

@Injectable({ providedIn: 'root' })
export class PanelService {
  private panelActivo$ = new BehaviorSubject<PanelActivo>(null);
  panel$ = this.panelActivo$.asObservable();

  abrir(panel: PanelActivo) {
    // Si ya está abierto, lo cierra; si no, abre el nuevo (cerrando el otro)
    const actual = this.panelActivo$.getValue();
    this.panelActivo$.next(actual === panel ? null : panel);
  }

  cerrar() {
    this.panelActivo$.next(null);
  }
}
