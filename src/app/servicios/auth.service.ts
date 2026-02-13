import{ Injectable } from '@angular/core';
import {catchError, Observable, tap, throwError} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {LoginRequest} from '../dto/login-request';
import {TokenResponse} from '../dto/token-response';
import {ErrorResponse} from '../dto/error-response';
import { RedireccionService } from './redireccion.service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  //private url = `${environment.backendUrl}/api/auth`;
  private url='http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'authToken';
  private readonly TOKEN_TYPE_KEY = 'tokenType';
  private readonly EXPIRE_AT_KEY = 'expireAt';
  private readonly ROLES_KEY = 'roles';
  private readonly USER_EMAIL_KEY = 'userEmail';
  private readonly USER_PHONE_KEY = 'userPhone';
  private readonly USER_ID_KEY='userId'
  private readonly USER_NAME_KEY='userName'
  private readonly USER_LASTNAME_KEY='userLastName'
  private readonly USER_DOCUMENT_KEY='documento'
  private readonly USER_PASSWORD_KEY='userPassword'
  private readonly INMUEBLES_KEY='inmuebles'
  constructor(private http: HttpClient, private redireccionService: RedireccionService) {}

  /**
   * Envía las credenciales al backend y almacena el token.
   * @param email Nombre de usuario o correo
   * @param contrasena Contraseña
   * @returns Observable con la respuesta del servidor*/
  login(email: string, contrasena: string): Observable<TokenResponse> {
    console.log('Enviando credenciales al backend:', { email, contrasena });
    const urlLogin = `${this.url}/login`;
    const request = { email, contrasena };

    return this.http.post<TokenResponse>(urlLogin, request).pipe(
      tap(response => {
        console.log('Token recibido del backend:', response);
        this.cambiarDatosToken(response);


        // Mostrar mensaje de éxito
        this.showAlert('success', 'Inicio de sesión exitoso');
      }),
      catchError(error => {
        console.error('Error en la llamada al backend:', error);

        // Tomar el mensaje enviado por el backend
        const mensajeBackend = error.error?.message;
        let errorMsg = mensajeBackend || 'Error al iniciar sesión';

        // Personalizar mensajes según el texto recibido
        switch (mensajeBackend) {
          case 'Usuario no encontrado':
            errorMsg = 'El email ingresado no está registrado';
            break;
          case 'Contraseña incorrecta':
            errorMsg = 'La contraseña es incorrecta';
            break;
          case 'Usuario bloqueado':
            errorMsg = 'Tu cuenta está bloqueada, contacta al soporte';
            break;
        }

        // Mostrar alerta de error usando showAlert
        this.showAlert('error', errorMsg);

        return throwError(() => new Error(errorMsg));
      })
    );
  }



  /**
   * Verifica si el usuario está autenticado y eltoken no ha expirado
   * Si el token está corrupto o expirado, lo elimina automáticamente
   */
  isAuthenticated(): boolean {
    const expireAt = localStorage.getItem(this.EXPIRE_AT_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!expireAt || !token) {
      this.logout(); // Limpia cualquier estado inconsistente
      return false;
    }
    const expireDate = new Date(expireAt);
    if (expireDate <= new Date()) {
      this.logout(); // Token expirado, limpiar
      return false;
    }
    return true;
}


  /**
   *Cierra la sesión
   */
  logout(): void {
    localStorage.clear();
    this.redireccionService.redirigirAHome();
  }

  limpiarStorage(): void {
    localStorage.clear();
  }

  cambiarDatosToken(response: TokenResponse): void {
    const tokenDecodificado: any = jwtDecode(response.token);

    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.TOKEN_TYPE_KEY, tokenDecodificado.type);
    localStorage.setItem(this.EXPIRE_AT_KEY, tokenDecodificado.exp);
    localStorage.setItem(this.USER_EMAIL_KEY, tokenDecodificado.sub);
    localStorage.setItem(this.USER_ID_KEY, tokenDecodificado.id);
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(
      Array.isArray(tokenDecodificado.rol) ? tokenDecodificado.rol : [tokenDecodificado.rol]
    ));
    localStorage.setItem(this.USER_NAME_KEY, tokenDecodificado.nombre);
    localStorage.setItem(this.USER_LASTNAME_KEY, tokenDecodificado.apellido);
    localStorage.setItem(this.USER_PHONE_KEY, tokenDecodificado.telefono);
    localStorage.setItem(this.USER_DOCUMENT_KEY, tokenDecodificado.documentoIdentidad);
    localStorage.setItem(this.USER_PASSWORD_KEY,tokenDecodificado.contrasena)
    //localStorage.setItem(this.INMUEBLES_KEY,JSON.stringify(response.listaInmuebles))
    console.log(localStorage.getItem(this.ROLES_KEY))
  }

 public getToken(): string | null {
return localStorage.getItem(this.TOKEN_KEY);
  }

  getRoles(): string[] {
    const roles = localStorage.getItem(this.ROLES_KEY);
    if (!roles || roles === "undefined") {
      return [];
    }
    try {
      const parsed = JSON.parse(roles);
// Si es un array, loretornamos, si es string, lo envolvemos en array
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === 'string') {
        return [parsed];
      } else {
        return [];
      }
    } catch (e) {
      // Si no es JSONválido, lo devolvemos como string en array
      return [roles];
    }
  }

  getUserEmail(): string | null {
    return localStorage.getItem(this.USER_EMAIL_KEY);
  }

  obtenerNombreUsuario(): string | null {
    console.log(localStorage.getItem(this.USER_NAME_KEY))
    return localStorage.getItem(this.USER_NAME_KEY)
  }

  obtenerApellidoUsuario(): string | null {
    console.log(localStorage.getItem(this.USER_LASTNAME_KEY))
    return localStorage.getItem(this.USER_LASTNAME_KEY)
  }


  obtenerTelefonoUsuario(): string | null {
    return localStorage.getItem(this.USER_PHONE_KEY)
  }

  obtenerIdUsuario(): string | null {
    return localStorage.getItem(this.USER_ID_KEY)
  }

  obtenerDocumentoUsuario(): string | null {
    return localStorage.getItem(this.USER_DOCUMENT_KEY)
  }

  obtenerContrasenaUsuario(): string {
    return <string>localStorage.getItem(this.USER_PASSWORD_KEY)
  }

  getPrimerRol(): string | null {
    const roles = localStorage.getItem(this.ROLES_KEY);
    if (!roles || roles === 'undefined') {
      return null;
    }

    try {
      const parsed = JSON.parse(roles);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      } else if (typeof parsed === 'string') {
        return parsed;
      }
    } catch (e) {
      // Si no es JSON válido, asumimos que es un string plano
      return roles;
    }

    return null;
  }

 /* modificarCredencialesToken(token: TokenResponse): void {
    const tokenDecodificado: any = jwtDecode(token.token);
    localStorage.setItem(this.TOKEN_KEY, token.token);
    localStorage.setItem(this.TOKEN_TYPE_KEY, token.type);
    localStorage.setItem(this.EXPIRE_AT_KEY, token.exp);
    localStorage.setItem(this.USER_EMAIL_KEY, token.sub);
    localStorage.setItem(this.USER_ID_KEY, token.id);
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(
      Array.isArray(tokenDecodificado.rol) ? tokenDecodificado.rol : [tokenDecodificado.rol]
    ));
    localStorage.setItem(this.USER_NAME_KEY, token.nombre);
    localStorage.setItem(this.USER_LASTNAME_KEY, token.apellido);
    localStorage.setItem(this.USER_PHONE_KEY, token.telefono);
    localStorage.setItem(this.USER_DOCUMENT_KEY, token.documentoIdentidad);
    localStorage.setItem(this.USER_PASSWORD_KEY,token.contrasena)
  }

  */



  /**
   * Decodifica el token JWT para extraer información como roles.
  * @returns Roles extraídos del token o un arreglo vacío si el token es inválido.
   */
  decodeTokenRoles(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }
    try {
      const decoded: any = jwtDecode(token);
      console.log('Token decodificado en decodeTokenRoles:', decoded);

      // El campo del rol en nuestro token es 'rol'
      let roles: string[] = [];
      if (decoded.rol) {
        roles = Array.isArray(decoded.rol) ? decoded.rol : [decoded.rol];
      }

     console.log('Roles en decodeTokenRoles:', roles);
      return roles || [];
    } catch (e) {
      console.error('Error al decodificar el token:', e);
      return [];
    }
  }

  showAlert(type: 'success' | 'error', message: string): void {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mt-3`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.padding = '15px';
    alertDiv.style.borderRadius = '5px';
    alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

    if (type === 'success') {
      alertDiv.style.backgroundColor = '#d4edda';
      alertDiv.style.color = '#155724';
      alertDiv.style.borderColor = '#c3e6cb';
    } else {
      alertDiv.style.backgroundColor = '#f8d7da';
      alertDiv.style.color = '#721c24';
      alertDiv.style.borderColor = '#f5c6cb';
    }

    document.body.appendChild(alertDiv);

    // Eliminar la alerta después de 3 segundos
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  }

}
