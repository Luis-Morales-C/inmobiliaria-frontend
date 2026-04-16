import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CaptacionInmuebleDTO } from '../dto/captacion-inmueble-dto';
import { InmuebleResponse } from '../dto/inmueble-response';
import {UserResponse} from '../dto/user-response'; // Asegúrate de tener esta interfaz

@Injectable({
  providedIn: 'root'
})
export class InmuebleServiceService {
  private url = 'http://localhost:8080/api/inmuebles';

  constructor(private http: HttpClient) {}

  public registrarInmueble(archivos: FormData): Observable<any> {
    return this.http.post<any>(`${this.url}`, archivos);
  }

  public obtenerListaDeInmuebles(): Observable<InmuebleResponse[]> {
    return this.http.get<InmuebleResponse[]>(`${this.url}`);
  }

  public obtenerListaInmueblesAgente(email: string): Observable<InmuebleResponse[]> {
    return this.http.get<InmuebleResponse[]>(`${this.url}/agente/${email}`);

  }

  public obtenerListaInmueblesUsuario(email: string): Observable<InmuebleResponse[]> {
    return this.http.get<InmuebleResponse[]>(`${this.url}/${email}`);
  }

  public actualizarEstadoTransaccion(id: number, estadoTransa: string): Observable<InmuebleResponse> {
    return this.http.put<InmuebleResponse>(`${this.url}/agente/${estadoTransa}/${id}`, null);
  }

  public obtenerTodosLosUsuariosHabilitados(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.url}/agente/obtenerTodos`);
  }

  public eliminarInmueble(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  buscarCatalogo(filtros: any, pagina: number = 0): Observable<any> {
    const params = { ...filtros, pagina, tamano: 9 };
    // Elimina valores vacíos/null para no enviar params sucios
    Object.keys(params).forEach(k => {
      if (params[k] === null || params[k] === '' || params[k] === undefined) {
        delete params[k];
      }
    });
    return this.http.get<any>(`${this.url}/catalogo`, { params });
  }

}
