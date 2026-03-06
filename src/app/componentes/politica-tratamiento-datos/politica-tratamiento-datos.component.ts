import { Component, OnInit, OnDestroy } from '@angular/core';
import {RedireccionService} from '../../servicios/redireccion.service';
import {AuthService} from '../../servicios/auth.service';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-politica-tratamiento-datos',
  imports: [CommonModule],
  templateUrl: './politica-tratamiento-datos.component.html',
  styleUrl: './politica-tratamiento-datos.component.css'
})
export class PoliticaTratamientoDatosComponent implements OnInit, OnDestroy {
  t: typeof ES;
  private sub!: Subscription;

  constructor(
    protected redireccionamiento: RedireccionService,
    private authservice: AuthService,
    public idiomaService: IdiomaService
  ) {
    this.t = idiomaService.t;
  }

  ngOnInit(): void {
    this.sub = this.idiomaService.traducciones$.subscribe(t => {
      this.t = t;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
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
