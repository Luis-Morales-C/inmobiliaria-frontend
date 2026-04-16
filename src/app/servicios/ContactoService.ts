import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Contacto } from '../dto/contacto';

@Injectable({ providedIn: 'root' })
export class ContactoService {

  private url = 'http://localhost:8080/api/contactos';
  private contactosSubject = new BehaviorSubject<Contacto[]>([]);
  contactos$ = this.contactosSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Llamado en el login — carga del backend y guarda en memoria
  getContactos(): Observable<Contacto[]> {
    return this.http.get<Contacto[]>(this.url).pipe(
      tap(contactos => this.contactosSubject.next(contactos))
    );
  }

  // Usado por el ChatComponent para leer sin hacer petición HTTP
  getContactosActuales(): Contacto[] {
    return this.contactosSubject.getValue();
  }

  agregarContacto(email: string): Observable<Contacto> {
    return this.http.post<Contacto>(`${this.url}/${email}`, {}).pipe(
      tap(nuevo => {
        const actuales = this.contactosSubject.getValue();
        const yaExiste = actuales.some(c => c.email === nuevo.email);
        if (!yaExiste) {
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
