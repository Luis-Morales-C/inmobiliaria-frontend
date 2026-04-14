import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MetricasService {

  // Ahora apunta a tu backend, no a Prometheus directamente
  private apiUrl = `${environment.backendUrl}/api/metricas/query`;

  constructor(private http: HttpClient) {}

  private query(q: string): Observable<any> {
    return this.http.get(this.apiUrl, {
      params: { query: q }
    }).pipe(catchError(() => of({ data: { result: [] } })));
  }

  private getValue(res: any): number {
    const value = res?.data?.result?.[0]?.value?.[1];
    if (!value || value === 'NaN' || value === 'Inf') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  getTasaExitoLogin(): Observable<number> {
    const q = `(1 - (sum(http_server_requests_seconds_count{uri="/api/auth/login", status="500"}) or vector(0)) / sum(http_server_requests_seconds_count{uri="/api/auth/login"})) * 100`;
    return this.query(q).pipe(map(res => this.getValue(res)));
  }

  getTiempoRespuestaLogin(): Observable<number> {
    const q = `sum(rate(http_server_requests_seconds_sum{uri="/api/auth/login", method="POST"}[7d])) / sum(rate(http_server_requests_seconds_count{uri="/api/auth/login", method="POST"}[7d]))`;
    return this.query(q).pipe(map(res => this.getValue(res)));
  }

  getTiempoRespuestaRegistroUsuario(): Observable<number> {
    const q = `sum(rate(http_server_requests_seconds_sum{uri="/api/usuarios", method="POST"}[7d]))/sum(rate(http_server_requests_seconds_count{uri="/api/usuarios", method="POST"}[7d]))`;
    return this.query(q).pipe(map(res => this.getValue(res)));
  }

  getTiempoRespuestaRegistroInmueble(): Observable<number> {
    const q = `sum(rate(http_server_requests_seconds_sum{uri="/api/inmuebles", method="POST"}[7d])) / sum(rate(http_server_requests_seconds_count{uri="/api/inmuebles", method="POST"}[7d]))`;
    return this.query(q).pipe(map(res => this.getValue(res)));
  }

  getTasaErroresRegistroUsuario(): Observable<number> {
    const q = `sum(http_server_requests_seconds_count{uri="/api/auth/register", status="400"}) / sum(http_server_requests_seconds_count{uri="/api/auth/register"}) * 100`;
    return this.query(q).pipe(
      map(res => {
        const value = res?.data?.result?.[0]?.value?.[1];
        return value ? parseFloat(value) : 0;
      })
    );
  }

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
  // Agrega este método al MetricasService existente

  getHistoricoMetrica(query: string, horas: number = 24): Observable<any> {
    const ahora = Math.floor(Date.now() / 1000);
    const inicio = ahora - horas * 3600;

    return this.http.get(`${environment.backendUrl}/api/metricas/query_range`, {
      params: {
        query,
        start: inicio.toString(),
        end: ahora.toString(),
        step: '300'  // punto cada 5 minutos
      }
    }).pipe(catchError(() => of({ data: { result: [] } })));
  }

  getHistoricoTiempoLogin(): Observable<any> {
    return this.getHistoricoMetrica(
      `sum(rate(http_server_requests_seconds_sum{uri="/api/auth/login", method="POST"}[5m])) / sum(rate(http_server_requests_seconds_count{uri="/api/auth/login", method="POST"}[5m]))`
    );
  }

  getHistoricoTasaExitoLogin(): Observable<any> {
    return this.getHistoricoMetrica(
      `(1 - (sum(http_server_requests_seconds_count{uri="/api/auth/login", status="500"}) or vector(0)) / sum(http_server_requests_seconds_count{uri="/api/auth/login"})) * 100`
    );
  }

  getHistoricoErroresRegistro(): Observable<any> {
    return this.getHistoricoMetrica(
      `sum(http_server_requests_seconds_count{uri="/api/auth/register", status="400"}) / sum(http_server_requests_seconds_count{uri="/api/auth/register"}) * 100`
    );
  }

  getHistoricoTiempoInmueble(): Observable<any> {
    return this.getHistoricoMetrica(
      `sum(rate(http_server_requests_seconds_sum{uri="/api/inmuebles", method="POST"}[5m])) / sum(rate(http_server_requests_seconds_count{uri="/api/inmuebles", method="POST"}[5m]))`
    );
  }
}
