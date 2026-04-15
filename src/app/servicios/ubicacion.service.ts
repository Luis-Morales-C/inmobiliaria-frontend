import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UbicacionService {

  private datos$: Observable<Record<string, string[]>>;

  constructor(private http: HttpClient) {
    // ahora http ya está disponible
    this.datos$ = this.http
      .get<Record<string, string[]>>('colombia.json')
      .pipe(shareReplay(1));
  }

  getDepartamentosCiudades(): Observable<Record<string, string[]>> {
    return this.datos$;
  }

  getDepartamentos(): Observable<string[]> {
    return this.datos$.pipe(
      map(data => Object.keys(data).sort())
    );
  }
}
