import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MetricasService {

  private prometheusUrl = 'http://localhost:9090/api/v1/query';

  constructor(private http: HttpClient) {}

  private query(q: string): Observable<any> {
    return this.http.get(this.prometheusUrl, {
      params: { query: q }
    });
  }

  getTiempoRespuestaLogin(): Observable<number> {
    const q = `rate(http_server_requests_seconds_sum{uri="/api/auth/login", method="POST"}[1h])/rate(http_server_requests_seconds_count{uri="/api/auth/login", method="POST"}[1h])`;
    return this.query(q).pipe(
      map(res => {
        const value = res?.data?.result?.[0]?.value?.[1];
        return value ? parseFloat(value) : 0;
      })
    );
  }

  getTasaExitoLogin(): Observable<number> {
    const q = `sum(http_server_requests_seconds_count{uri="/api/auth/login",status="200"}) / sum(http_server_requests_seconds_count{uri="/api/auth/login"}) * 100`;
    return this.query(q).pipe(
      map(res => {
        const value = res?.data?.result?.[0]?.value?.[1];
        return value ? parseFloat(value) : 0;
      })
    );
  }

  getTasaErroresRegistro(): Observable<number> {
    const q = `sum(http_server_requests_seconds_count{uri="/api/auth/register",status="400"}) / sum(http_server_requests_seconds_count{uri="/api/auth/register"}) * 100`;
    return this.query(q).pipe(
      map(res => {
        const value = res?.data?.result?.[0]?.value?.[1];
        return value ? parseFloat(value) : 0;
      })
    );
  }

  getTodasLasMetricas(): Observable<any> {
    return forkJoin({
      tiempoRespuesta: this.getTiempoRespuestaLogin(),
      tasaExito: this.getTasaExitoLogin(),
      tasaErrores: this.getTasaErroresRegistro()
    });
  }
}
