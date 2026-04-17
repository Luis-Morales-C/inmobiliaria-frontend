import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Contacto } from '../dto/contacto';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ContactoService {

  private url = 'http://localhost:8080/api/contactos';
  private contactosSubject = new BehaviorSubject<Contacto[]>([]);
  contactos$ = this.contactosSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    // ✅ Si hay sesión activa al recargar, carga los contactos automáticamente
    if (this.authService.isAuthenticated()) {
      this.cargarContactos();
    }

    // ✅ Reacciona a cambios de autenticación
    this.authService.isAuthenticated$.subscribe(autenticado => {
      if (autenticado) {
        this.cargarContactos();
      } else {
        // Limpia los contactos al cerrar sesión
        this.contactosSubject.next([]);
      }
    });
  }

  private cargarContactos(): void {
    this.http.get<Contacto[]>(this.url).subscribe({
      next: contactos => this.contactosSubject.next(contactos),
      error: err => console.error('Error cargando contactos:', err)
    });
  }

  // Llamado en el login para encadenar con switchMap
  getContactos(): Observable<Contacto[]> {
    return this.http.get<Contacto[]>(this.url).pipe(
      tap(contactos => this.contactosSubject.next(contactos))
    );
  }

  getContactosActuales(): Contacto[] {
    return this.contactosSubject.getValue();
  }

  agregarContacto(email: string): Observable<Contacto> {
    return this.http.post<Contacto>(`${this.url}/${email}`, {}).pipe(
      tap(nuevo => {
        const actuales = this.contactosSubject.getValue();
        if (!actuales.some(c => c.email === nuevo.email)) {
          this.contactosSubject.next([...actuales, nuevo]);
        }
      })
    );
  }

  eliminarContacto(email: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${email}`).pipe(
      tap(() => {
        const actuales = this.contactosSubject.getValue();
        this.contactosSubject.next(actuales.filter(c => c.email !== email));
      })
    );
  }
}
