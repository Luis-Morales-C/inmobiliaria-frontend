import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, switchMap} from 'rxjs';
import {UserResponse} from '../dto/user-response';
import {UserRegistrationRequest} from '../dto/user-registration-request';
import {DesvincularRequestDto} from '../dto/desvincular-request-dto';
import {User} from '../modelo/User';
import {AuthService} from './auth.service';
import {TokenResponse} from '../dto/token-response';
import {CaptacionInmuebleDTO} from '../dto/captacion-inmueble-dto';
import {UsuarioResponseDto} from '../dto/usuario-response.dto';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  //private url = "https://inmobiliariasoft3back2-0.onrender.com/api/usuarios";
  private url='http://localhost:8080/api/usuarios';
  constructor(private http: HttpClient, private authservice: AuthService) {}

  public registrar(user: UserRegistrationRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.url}`, user);
  }

  public desvincular(email: string): Observable<string> {
  const token = this.authservice.getToken();
  if (!token) {
    throw new Error('El usuario no se encuentra logueado en estos momentos');
  }
  return this.http.put(`${this.url}/desvincular/${email}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    responseType: 'text'
  });
}


  public actualizarDatosUsuario(email: string, nombre: string, apellido: string, telefono: string, documentoIdentidad: string): Observable<TokenResponse> {

    const token = this.authservice.getToken();
    if (!token) {
      throw new Error('El usuario no se encuentra logueado en estos momentos');
    }

    const usuarioActualizado: UserRegistrationRequest = {
      nombre: nombre,
      apellido: apellido,
      documentoIdentidad: documentoIdentidad,
      telefono: telefono,
      email: email,
      contrasena: this.authservice.obtenerContrasenaUsuario()
    };

    // 🟢 Hacemos el PUT y esperamos un texto plano como respuesta
    return this.http.put<TokenResponse>(`${this.url}/actualizar/${email}`, usuarioActualizado, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  public obtenerTodosLosUsuariosHabilitados(id: number, token: string): Observable<UsuarioResponseDto[]> {
    return this.http.get<UsuarioResponseDto[]>(`${this.url}/agente/obtenerTodos/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }



}
