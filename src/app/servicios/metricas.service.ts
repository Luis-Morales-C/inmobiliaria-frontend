import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MetricasService {

  private prometheusUrl = 'http://localhost:9090/api/v1/query';

  constructor(private http: HttpClient) {}

  private query(q: string): Observable<any> {
    return this.http.get(this.prometheusUrl, {
      params: { query: q }
    }).pipe(catchError(() => of({ data: { result: [] } })));
  }

  private getValue(res: any): number {
    const value = res?.data?.result?.[0]?.value?.[1];
    if (!value || value === 'NaN' || value === 'Inf') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Tasa de autenticaciones exitosas
  getTasaExitoLogin(): Observable<number> {
    const q = `(1 - (sum(http_server_requests_seconds_count{uri="/api/auth/login", status="500"}) or vector(0)) / sum(http_server_requests_seconds_count{uri="/api/auth/login"})) * 100`;
    return this.query(q).pipe(
        map(res => this.getValue(res))
    );
  }

  // Tiempo medio de respuesta - Login
  getTiempoRespuestaLogin(): Observable<number> {
    const q = `sum(rate(http_server_requests_seconds_sum{uri="/api/auth/login", method="POST"}[7d])) / sum(rate(http_server_requests_seconds_count{uri="/api/auth/login", method="POST"}[7d]))`;
    return this.query(q).pipe(map(res => this.getValue(res)));
  }

  // Tiempo medio de respuesta - Registro de usuario
  getTiempoRespuestaRegistroUsuario(): Observable<number> {
    const q = `sum(rate(http_server_requests_seconds_sum{uri="/api/usuarios", method="POST"}[7d]))/sum(rate(http_server_requests_seconds_count{uri="/api/usuarios", method="POST"}[7d]))`;
    return this.query(q).pipe(map(res => this.getValue(res)));
  }

  // Eficiencia del registro de propiedades - /api/inmuebles POST
  getTiempoRespuestaRegistroInmueble(): Observable<number> {
    const q = `sum(rate(http_server_requests_seconds_sum{uri="/api/inmuebles", method="POST"}[7d])) / sum(rate(http_server_requests_seconds_count{uri="/api/inmuebles", method="POST"}[7d]))`;
    return this.query(q).pipe(map(res => this.getValue(res)));
  }


  // Tasa de errores en registro de usuario
  getTasaErroresRegistroUsuario(): Observable<number> {
    const q = `sum(http_server_requests_seconds_count{uri="/api/auth/register", status="400"}) / sum(http_server_requests_seconds_count{uri="/api/auth/register"}) * 100`;
    return this.query(q).pipe(
      map(res => {
        const value = res?.data?.result?.[0]?.value?.[1];
        return value ? parseFloat(value) : 0;
      })
    );
  }


  // Precisión actualización estado inmueble - /api/inmuebles/agente/{estadoTransa}/{id} PUT
  getTasaExitoActualizacionEstado(): Observable<number> {
    const q = `sum(http_server_requests_seconds_count{uri=~"/api/inmuebles/agente/.*", method="PUT", status="200"}) / sum(http_server_requests_seconds_count{uri=~"/api/inmuebles/agente/.*", method="PUT"}) * 100`;
    return this.query(q).pipe(
      map(res => {
        const value = res?.data?.result?.[0]?.value?.[1];
        return value ? parseFloat(value) : 0;
      })
    );
  }

  getTodasLasMetricas(): Observable<any> {
    return forkJoin({
      tiempoRespuestaLogin: this.getTiempoRespuestaLogin(),
      tasaExitoLogin: this.getTasaExitoLogin(),
      tiempoRespuestaRegistroUsuario: this.getTiempoRespuestaRegistroUsuario(),
      tasaErroresRegistroUsuario: this.getTasaErroresRegistroUsuario(),
      tiempoRespuestaRegistroInmueble: this.getTiempoRespuestaRegistroInmueble(),
      tasaExitoActualizacionEstado: this.getTasaExitoActualizacionEstado()
    });
  }


}
