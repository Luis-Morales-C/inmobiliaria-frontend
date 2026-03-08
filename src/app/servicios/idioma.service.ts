import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ES } from '../i18n/es';
import { EN } from '../i18n/en';

export type Idioma = 'es' | 'en';

@Injectable({
  providedIn: 'root'
})
export class IdiomaService {
  private readonly STORAGE_KEY = 'idioma';
  private idiomaActual: Idioma;

  private _traducciones = new BehaviorSubject<typeof ES>(ES);
  readonly traducciones$ = this._traducciones.asObservable();

  constructor() {
    const guardado = localStorage.getItem(this.STORAGE_KEY) as Idioma | null;
    this.idiomaActual = guardado === 'en' ? 'en' : 'es';
    this._traducciones.next(this.idiomaActual === 'en' ? EN : ES);
  }

  get idioma(): Idioma {
    return this.idiomaActual;
  }

  get t(): typeof ES {
    return this._traducciones.getValue();
  }

  cambiarIdioma(idioma: Idioma): void {
    this.idiomaActual = idioma;
    localStorage.setItem(this.STORAGE_KEY, idioma);
    this._traducciones.next(idioma === 'en' ? EN : ES);
  }
}
