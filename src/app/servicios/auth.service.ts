import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TokenResponse } from '../dto/token-response';
import { RedireccionService } from './redireccion.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private url = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'authToken';
  private readonly TOKEN_TYPE_KEY = 'tokenType';
  private readonly EXPIRE_AT_KEY = 'expireAt';
  private readonly ROLES_KEY = 'roles';
  private readonly USER_EMAIL_KEY = 'userEmail';
  private readonly USER_PHONE_KEY = 'userPhone';
  private readonly USER_ID_KEY = 'userId';
  private readonly USER_NAME_KEY = 'userName';
  private readonly USER_LASTNAME_KEY = 'userLastName';
  private readonly USER_DOCUMENT_KEY = 'documento';
  private readonly USER_PASSWORD_KEY = 'userPassword';

  // ✅ Estado reactivo de autenticación
  private authStatus = new BehaviorSubject<boolean>(this.checkAuth());
  isAuthenticated$ = this.authStatus.asObservable();

  constructor(private http: HttpClient, private redireccionService: RedireccionService) {}

  login(email: string, contrasena: string, recaptchaToken: string): Observable<TokenResponse> {
    const urlLogin = `${this.url}/login`;
    const request = { email, contrasena, recaptchaToken };

    return this.http.post<TokenResponse>(urlLogin, request).pipe(
      tap(response => {
        this.cambiarDatosToken(response);
        this.authStatus.next(true); // ✅ Notifica que el usuario está autenticado
        this.showAlert('success', 'Inicio de sesión exitoso');
      }),
      catchError(error => {
        const mensajeBackend = error.error?.message;
        let errorMsg = mensajeBackend || 'Error al iniciar sesión';
        if (error.status === 400 && errorMsg.includes('reCAPTCHA')) {
          errorMsg = 'Por favor, completa el captcha correctamente.';
        }
        this.showAlert('error', errorMsg);
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  // ✅ Verifica token sin limpiar sesión innecesariamente
  private checkAuth(): boolean {
    const expireAt = localStorage.getItem(this.EXPIRE_AT_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!expireAt || !token) return false;
    // expireAt está en milisegundos (lo guardamos así en cambiarDatosToken)
    return Number(expireAt) > Date.now();
  }

  isAuthenticated(): boolean {
    return this.checkAuth();
  }

  logout(): void {
    this.authStatus.next(false); // ✅ Notifica que el usuario cerró sesión
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
    // ✅ Guardamos en milisegundos para comparar con Date.now()
    localStorage.setItem(this.EXPIRE_AT_KEY, String(tokenDecodificado.exp * 1000));
    localStorage.setItem(this.USER_EMAIL_KEY, tokenDecodificado.sub);
    localStorage.setItem(this.USER_ID_KEY, tokenDecodificado.id);
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(
      Array.isArray(tokenDecodificado.rol) ? tokenDecodificado.rol : [tokenDecodificado.rol]
    ));
    localStorage.setItem(this.USER_NAME_KEY, tokenDecodificado.nombre);
    localStorage.setItem(this.USER_LASTNAME_KEY, tokenDecodificado.apellido);
    localStorage.setItem(this.USER_PHONE_KEY, tokenDecodificado.telefono);
    localStorage.setItem(this.USER_DOCUMENT_KEY, tokenDecodificado.documentoIdentidad);
    localStorage.setItem(this.USER_PASSWORD_KEY, tokenDecodificado.contrasena);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRoles(): string[] {
    const roles = localStorage.getItem(this.ROLES_KEY);
    if (!roles || roles === 'undefined') return [];
    try {
      const parsed = JSON.parse(roles);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
      return [];
    } catch {
      return [roles];
    }
  }

  getUserEmail(): string | null {
    return localStorage.getItem(this.USER_EMAIL_KEY);
  }

  obtenerNombreUsuario(): string | null {
    return localStorage.getItem(this.USER_NAME_KEY);
  }

  obtenerApellidoUsuario(): string | null {
    return localStorage.getItem(this.USER_LASTNAME_KEY);
  }

  obtenerTelefonoUsuario(): string | null {
    return localStorage.getItem(this.USER_PHONE_KEY);
  }

  obtenerIdUsuario(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  obtenerDocumentoUsuario(): string | null {
    return localStorage.getItem(this.USER_DOCUMENT_KEY);
  }

  obtenerContrasenaUsuario(): string {
    return localStorage.getItem(this.USER_PASSWORD_KEY) as string;
  }

  getPrimerRol(): string | null {
    const roles = localStorage.getItem(this.ROLES_KEY);
    if (!roles || roles === 'undefined') return null;
    try {
      const parsed = JSON.parse(roles);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      if (typeof parsed === 'string') return parsed;
    } catch {
      return roles;
    }
    return null;
  }

  decodeTokenRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.rol) {
        return Array.isArray(decoded.rol) ? decoded.rol : [decoded.rol];
      }
      return [];
    } catch {
      return [];
    }
  }

  showAlert(type: 'success' | 'error', message: string): void {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mt-3`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      padding: 15px; border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    `;
    if (type === 'success') {
      alertDiv.style.backgroundColor = '#d4edda';
      alertDiv.style.color = '#155724';
    } else {
      alertDiv.style.backgroundColor = '#f8d7da';
      alertDiv.style.color = '#721c24';
    }
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.parentNode?.removeChild(alertDiv), 3000);
  }

  enviarCodigoRecuperacion(email: string, recaptchaToken: string): Observable<string> {
    const url = `${this.url}/recuperar`;
    return this.http.post(url, { email, recaptchaToken }, { responseType: 'text' }).pipe(
      tap(() => this.showAlert('success', 'Se ha enviado un código a tu correo.')),
      catchError(error => {
        let errorMsg = 'Error al solicitar recuperación';
        if (error.error) {
          try { errorMsg = JSON.parse(error.error).message || errorMsg; }
          catch { errorMsg = error.error || errorMsg; }
        }
        this.showAlert('error', errorMsg);
        return throwError(() => errorMsg);
      })
    );
  }

  cambiarContrasenaConCodigo(email: string, codigo: string, nuevaContrasena: string): Observable<string> {
    return this.http.post(`${this.url}/recuperar/cambiar`, { email, codigo, nuevaContrasena }, { responseType: 'text' }).pipe(
      tap(() => this.showAlert('success', 'Contraseña actualizada correctamente')),
      catchError(error => {
        this.showAlert('error', error.error || 'Código inválido o expirado');
        return throwError(() => error);
      })
    );
  }

  enviarContacto(data: {
    nombre: string; telefono: string; correo: string;
    asunto: string; mensaje: string; recaptchaToken: string;
  }): Observable<string> {
    return this.http.post(`${this.url}/contacto`, data, { responseType: 'text' }).pipe(
      tap(() => this.showAlert('success', 'Mensaje enviado correctamente')),
      catchError(error => {
        this.showAlert('error', error.error || 'Error al enviar el mensaje');
        return throwError(() => error);
      })
    );
  }
}
