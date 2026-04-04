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

  private url = `${environment.backendUrl}/api/auth`;
  //private url='http://localhost:8080/api/auth';
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
   * Envía las credenciales y el token de captcha al backend
   * @param email Nombre de usuario o correo
   * @param contrasena Contraseña
   * @param recaptchaToken Token generado por Google reCaptcha
   */
  login(email: string, contrasena: string, recaptchaToken: string): Observable<TokenResponse> {
    const urlLogin = `${this.url}/login`;

    // Ahora el request coincide con tu LoginRequest del Backend
    const request = {
      email,
      contrasena,
      recaptchaToken
    };

    return this.http.post<TokenResponse>(urlLogin, request).pipe(
      tap(response => {
        this.cambiarDatosToken(response);
        this.showAlert('success', 'Inicio de sesión exitoso');
      }),
      catchError(error => {
        const mensajeBackend = error.error?.message;
        let errorMsg = mensajeBackend || 'Error al iniciar sesión';

        // Manejo de errores específico para el Captcha
        if (error.status === 400 && errorMsg.includes('reCAPTCHA')) {
          errorMsg = 'Por favor, completa el captcha correctamente.';
        }

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


  enviarCodigoRecuperacion(email: string, recaptchaToken: string): Observable<string> {
    const url = `${this.url}/recuperar`;
    const body = { email, recaptchaToken };

    return this.http.post(url, body, { responseType: 'text' }).pipe(
      tap(() => {
        // Este mensaje solo saldrá si el servidor responde 200 OK
        this.showAlert('success', 'Se ha enviado un código a tu correo.');
      }),
      catchError(error => {
        console.error('Error en recuperación:', error);

        let errorMsg = 'Error al solicitar recuperación';

        // Intentamos extraer el mensaje real del backend (ValueConflictException)
        if (error.error) {
          try {
            // Si el backend envía un JSON como string, lo parseamos
            const errorBody = JSON.parse(error.error);
            errorMsg = errorBody.message || errorMsg;
          } catch (e) {
            // Si no es un JSON, puede que el mensaje venga directo
            errorMsg = error.error || errorMsg;
          }
        }

        this.showAlert('error', errorMsg);
        return throwError(() => errorMsg);
      })
    );
  }

  /**
   * Cambia la contraseña usando el código recibido por correo.
   */
  cambiarContrasenaConCodigo(
    email: string,
    codigo: string,
    nuevaContrasena: string
  ): Observable<string> {
    const url = `${this.url}/recuperar/cambiar`;

    const body = {
      email,
      codigo,
      nuevaContrasena

    };


    return this.http.post(url, body, { responseType: 'text' }).pipe(
      tap(() => {
        this.showAlert('success', 'Contraseña actualizada correctamente');
      }),
      catchError(error => {
        const mensaje = error.error || 'Código inválido o expirado';
        this.showAlert('error', mensaje);
        return throwError(() => error);
      })
    );
  }

  enviarContacto(data: {
    nombre: string;
    telefono: string;
    correo: string;
    asunto: string;
    mensaje: string;
    recaptchaToken: string
  }): Observable<string> {

    const url = `${this.url}/contacto`;


    return this.http.post(url, data, { responseType: 'text' }).pipe(
      tap(() => {
        this.showAlert('success', 'Mensaje enviado correctamente');
      }),
      catchError(error => {
        console.error('Error enviando contacto:', error);
        const mensaje = error.error || 'Error al enviar el mensaje';
        this.showAlert('error', mensaje);
        return throwError(() => error);
      })
    );
  }

}
