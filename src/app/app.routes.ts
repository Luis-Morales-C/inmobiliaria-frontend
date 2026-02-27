import { Routes } from '@angular/router';
import { InicioComponent } from './componentes/inicio/inicio.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import {VentanaAgenteComponent} from './componentes/ventana-agente/ventana-agente.component';
import {UnauthorizedComponent} from './componentes/unauthorized/unauthorized.component';
import {RegistroInmuebleComponent} from './componentes/registro-inmueble/registro-inmueble.component';
import {RecuperarContraseniaComponent} from './componentes/recuperar-contrasenia/recuperar-contrasenia.component';
import {ActivarComponent} from './componentes/activar-cuenta/activar.component';
import { InicioDefaultComponent } from './componentes/inicio-default/inicio-default.component';
import {PerfilComponent} from './componentes/perfil/perfil.component';
import {
  PoliticaTratamientoDatosComponent
} from './componentes/politica-tratamiento-datos/politica-tratamiento-datos.component';

import {authGuard} from './guards/auth.guard';
import {rolesGuard} from './guards/roles.guard';
import {RecuperarContrasenaComponent} from './componentes/recuperar-contrasena/recuperar-contrasena.component';
import {CambiarContrasenaComponent} from './componentes/cambiar-contrasena/cambiar-contrasena.component';


export const routes: Routes = [
  {
    path: '',
    component: InicioDefaultComponent
  },
  {
    path: 'inicio',
    component: InicioComponent,
    canActivate: [authGuard, rolesGuard],
    data: { expectedRoles: ["CLIENTE", "ASESOR","AGENTE"] }
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'registro',
    component: RegistroComponent
  },
  {
    path: 'politicaDatos',
    component: PoliticaTratamientoDatosComponent
  }
  ,
  {
    path: 'recuperar',
    component: RecuperarContrasenaComponent
  },
  {
    path: 'cambiar-contrasena',
    component: CambiarContrasenaComponent
  },
  // Rutas protegidas para usuarios logueados
  {
    path: 'recuperar2',
    component: RecuperarContraseniaComponent,

  },
  {
    path: 'activar',
    component: ActivarComponent
  },
  {
    path: 'ventanaAgente',
    component: VentanaAgenteComponent,
    canActivate: [rolesGuard],
    data: { expectedRoles: ["AGENTE"] }
  },
  {
    path: 'registroInmueble',
    component: RegistroInmuebleComponent,
    canActivate: [authGuard]
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: 'perfil',
    component: PerfilComponent
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  },
];
