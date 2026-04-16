import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contacto } from '../dto/contacto';

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private url = 'http://localhost:8080/api/contactos';

  constructor(private http: HttpClient) {}

  getContactos(): Observable<Contacto[]> {
    return this.http.get<Contacto[]>(this.url);
  }


}
