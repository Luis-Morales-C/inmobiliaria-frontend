import { Routes } from '@angular/router';
import { InicioComponent } from './componentes/inicio/inicio.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import {VentanaAgenteComponent} from './componentes/ventana-agente/ventana-agente.component';
import {VentanaUsuarioComponent} from './componentes/ventana-usuario/ventana-usuario.component';
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
  },
  // Rutas protegidas para usuarios logueados
  {
    path: 'recuperar',
    component: RecuperarContraseniaComponent,
    canActivate: [authGuard]
  },
  {
    path: 'activar',
    component: ActivarComponent
  },
  {
    path: 'ventanaUsuario',
    component: VentanaUsuarioComponent,
    canActivate: [rolesGuard],
    data: { expectedRoles: ["USUARIO"] }
  },
  {
    path: 'ventanaAgente',
    component: VentanaAgenteComponent,
    canActivate: [rolesGuard],
    data: { expectedRoles: ["AGENTE"] }
  },
  {
    path: 'ventanaAsesor',
    component: VentanaAgenteComponent,
    canActivate: [rolesGuard],
    data: { expectedRoles: ["ASESOR"] }
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
