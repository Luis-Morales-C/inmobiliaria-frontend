import { Component } from '@angular/core';
import {RedireccionService} from '../../servicios/redireccion.service';
import {AuthService} from '../../servicios/auth.service';

@Component({
  selector: 'app-politica-tratamiento-datos',
  imports: [],
  templateUrl: './politica-tratamiento-datos.component.html',
  styleUrl: './politica-tratamiento-datos.component.css'
})
export class PoliticaTratamientoDatosComponent {

  constructor(protected redireccionamiento: RedireccionService, private authservice: AuthService) {
  }

  redirigirAlInicioMetodo() {
    if(localStorage.getItem('migaPan')=='registro')
    {
      this.redireccionamiento.redirigirARegistro();
      localStorage.removeItem('migaPan')
    }
    else
    {
      if (this.authservice.getToken()!=null)
      {
        this.redireccionamiento.redirigirAHomeIngresado();
      }
      else
      {
        this.redireccionamiento.redirigirAHome();
      }
    }
  }
}
