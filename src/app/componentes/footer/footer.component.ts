import { Component } from '@angular/core';
import {RedireccionService} from '../../servicios/redireccion.service';
import { AuthService } from '../../servicios/auth.service';


@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

  constructor(protected redireccionamiento: RedireccionService,private authservice: AuthService) {  }



  redirigirARegistroInmueble() {
    if(this.authservice.getToken()==null)
    {
      this.redireccionamiento.redirigirALogin();
    }
    else
    {
      this.redireccionamiento.redirigirARegistroInmueble();
    }
  }
}
