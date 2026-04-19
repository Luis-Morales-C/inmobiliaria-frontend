import { Component, OnInit, OnDestroy } from '@angular/core';
import { RedireccionService } from '../../servicios/redireccion.service';
import { AuthService } from '../../servicios/auth.service';
import { IdiomaService } from '../../servicios/idioma.service';
import { ES } from '../../i18n/es';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit, OnDestroy {
  t: typeof ES;
  private sub!: Subscription;

  constructor(
    protected redireccionamiento: RedireccionService,
    private authservice: AuthService,
    public idiomaService: IdiomaService,
    private router: Router
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

  redirigirARegistroInmueble() {
    if(this.authservice.getToken() == null) {
      this.redireccionamiento.redirigirALogin();
    } else {
      this.redireccionamiento.redirigirARegistroInmueble();
    }
  }

  redirigirAManual() {
    this.router.navigate(['/manual-usuario']);
  }
}
