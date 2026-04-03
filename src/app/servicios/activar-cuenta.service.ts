import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definición de interfaces para las respuestas
export interface ActivationResponse {
  message?: string;
  // Pueden agregarse más propiedades según la respuesta real del backend
}

export interface ResendCodeResponse {
  message?: string;
  // Pueden agregarse más propiedades según la respuesta real del backend
}

@Injectable({
  providedIn: 'root'
})
export class ActivarCuentaService {
  //private baseUrl = 'https://inmobiliariasoft3back2-0.onrender.com/api/auth';
  private baseUrl='http://localhost:8080/api/auth';
  constructor(private http: HttpClient) { }

  /**
   * Activa la cuenta del usuario usando el código de activación
   * @param code Código de activación de 6 dígitos
   * @returns Observable con la respuesta de activación
   */
  activateAccount(code: string): Observable<string> {
    const url = `${this.baseUrl}/activate/${code}`;
    return this.http.get(url, { responseType: 'text' });
  }

  /**
   * Reenvía el código de activación al correo del usuario
   * @param email Correo electrónico del usuario
   * @returns Observable con la respuesta del reenvío
   */
  resendActivationCode(email: string): Observable<ResendCodeResponse> {
    const url = `${this.baseUrl}/resend-activation`;
    return this.http.post<ResendCodeResponse>(url, { email });
  }
}
