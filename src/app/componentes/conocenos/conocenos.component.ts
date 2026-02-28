import { Component } from '@angular/core';
import {AuthService} from '../../servicios/auth.service';
import {RedireccionService} from '../../servicios/redireccion.service';



@Component({
  selector: 'app-conocenos',
  templateUrl: './conocenos.component.html',
  styleUrl: './conocenos.component.css'
})
export class ConocenosComponent {

  constructor(
    protected redireccionamiento: RedireccionService,
    private authservice: AuthService
  ) {}

  redirigirAlInicioMetodo() {
    if (this.authservice.getToken() != null) {
      this.redireccionamiento.redirigirAHomeIngresado();
    } else {
      this.redireccionamiento.redirigirAHome();
    }
  }
}
