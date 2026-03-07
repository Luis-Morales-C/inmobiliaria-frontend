import { Component, OnInit, OnDestroy } from '@angular/core';
import {AuthService} from '../../servicios/auth.service';
import {RedireccionService} from '../../servicios/redireccion.service';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';



@Component({
  selector: 'app-conocenos',
  templateUrl: './conocenos.component.html',
  styleUrl: './conocenos.component.css'
})
export class ConocenosComponent implements OnInit, OnDestroy {
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
    if (this.authservice.getToken() != null) {
      this.redireccionamiento.redirigirAHomeIngresado();
    } else {
      this.redireccionamiento.redirigirAHome();
    }
  }
}
