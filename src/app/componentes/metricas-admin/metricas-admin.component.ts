import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../servicios/auth.service';
import { ChatService } from '../../servicios/chat.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { MetricasService } from '../../servicios/metricas.service';
import { GraficaMetricaComponent} from '../grafica-metrica/grafica-metrica.component';
import { forkJoin } from 'rxjs';
import { environment} from '../../../environments/environment.prod';

export interface UsuarioAdminDto {
  id: number;
  email: string;
  rol: string;
  nombre: string;
  apellido: string;
  documentoIdentidad: string;
  telefono: string;
}

@Component({
  selector: 'app-metricas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, UserMenuComponent,GraficaMetricaComponent],
  templateUrl: './metricas-admin.component.html',
  styleUrls: ['./metricas-admin.component.css']
})
export class MetricasAdminComponent implements OnInit {

  // ─── Navbar ──────────────────────────────────────────────────────────
  userName: string = '';

  // ─── Métricas ────────────────────────────────────────────────────────
  tiempoRespuestaLogin: number = 0;
  tasaExitoLogin: number = 0;
  tiempoRespuestaRegistroUsuario: number = 0;
  tasaErroresRegistroUsuario: number = 0;
  tiempoRespuestaRegistroInmueble: number = 0;
  tasaExitoActualizacionEstado: number = 0;
  cargando: boolean = true;

  // Datos históricos — gráficas
  historicoTiempoLogin: any = null;
  historicoTasaExito: any = null;
  historicoErroresRegistro: any = null;
  historicoTiempoInmueble: any = null;
  cargandoGraficas = true;

  // ─── Usuarios ────────────────────────────────────────────────────────
  usuarios: UsuarioAdminDto[] = [];
  usuariosFiltrados: UsuarioAdminDto[] = [];
  cargandoUsuarios: boolean = false;
  busqueda: string = '';
  rolesSeleccionados: { [id: number]: string } = {};
  cambiandoRol: { [id: number]: boolean } = {};
  mensajeRol: string = '';
  mensajeRolExito: boolean = true;

  roles: string[] = [
    'ADMIN',
    'AGENTE',
    'CLIENTE',
    'GERENTE',
    'ASESOR_LEGAL',
    'PENDIENTE',
    'DESVINCULADO'
  ];

  private readonly API = `${environment.backendUrl}/api/usuarios`;

  constructor( private metricasService: MetricasService,
               private authService: AuthService,
               private chatService: ChatService,
               private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarMetricas();
    this.cargarGraficas();

    // Cargar nombre del usuario logueado
    const nombre = this.authService.obtenerNombreUsuario() ?? '';
    const apellido = this.authService.obtenerApellidoUsuario() ?? '';
    this.userName = `${nombre} ${apellido}`.trim();

    this.cargarUsuarios();
  }

  cargarMetricas(): void {
    this.cargando = true;
    this.metricasService.getTodasLasMetricas().subscribe({
      next: (data) => {
        this.tiempoRespuestaLogin = data.tiempoRespuestaLogin;
        this.tasaExitoLogin = data.tasaExitoLogin;
        this.tiempoRespuestaRegistroUsuario = data.tiempoRespuestaRegistroUsuario;
        this.tasaErroresRegistroUsuario = data.tasaErroresRegistroUsuario;
        this.tiempoRespuestaRegistroInmueble = data.tiempoRespuestaRegistroInmueble;
        this.tasaExitoActualizacionEstado = data.tasaExitoActualizacionEstado;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando métricas', err);
        this.cargando = false;
      }
    });
  }

  cargarGraficas(): void {
    this.cargandoGraficas = true;
    forkJoin({
      tiempoLogin: this.metricasService.getHistoricoTiempoLogin(),
      tasaExito: this.metricasService.getHistoricoTasaExitoLogin(),
      erroresRegistro: this.metricasService.getHistoricoErroresRegistro(),
      tiempoInmueble: this.metricasService.getHistoricoTiempoInmueble()
    }).subscribe({
      next: (data) => {
        this.historicoTiempoLogin = data.tiempoLogin;
        this.historicoTasaExito = data.tasaExito;
        this.historicoErroresRegistro = data.erroresRegistro;
        this.historicoTiempoInmueble = data.tiempoInmueble;
        this.cargandoGraficas = false;
      },
      error: () => { this.cargandoGraficas = false; }
    });
  }

  // ─── Usuarios ────────────────────────────────────────────────────────
  cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    const token = this.authService.getToken();

    this.http.get<UsuarioAdminDto[]>(`${this.API}/todos`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (lista) => {
        this.usuarios = lista;
        this.usuariosFiltrados = lista;
        lista.forEach(u => this.rolesSeleccionados[u.id] = u.rol);
        this.cargandoUsuarios = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios', err);
        this.cargandoUsuarios = false;
      }
    });
  }

  filtrarUsuarios(): void {
    const texto = this.busqueda.toLowerCase().trim();
    if (!texto) {
      this.usuariosFiltrados = this.usuarios;
      return;
    }
    this.usuariosFiltrados = this.usuarios.filter(u =>
      u.nombre.toLowerCase().includes(texto) ||
      u.apellido.toLowerCase().includes(texto) ||
      u.email.toLowerCase().includes(texto) ||
      u.documentoIdentidad?.toLowerCase().includes(texto)
    );
  }

  cambiarRol(usuario: UsuarioAdminDto): void {
    const nuevoRol = this.rolesSeleccionados[usuario.id];
    if (!nuevoRol || nuevoRol === usuario.rol) return;

    this.cambiandoRol[usuario.id] = true;
    const token = this.authService.getToken();

    this.http.put(`${this.API}/cambiar-rol`,
      { usuarioId: usuario.id, nuevoRol },
      { headers: { Authorization: `Bearer ${token}` }, responseType: 'text' }
    ).subscribe({
      next: () => {
        usuario.rol = nuevoRol;
        this.cambiandoRol[usuario.id] = false;
        this.mostrarMensaje(`Rol de ${usuario.nombre} cambiado a ${nuevoRol}`, true);
      },
      error: (err) => {
        console.error('Error cambiando rol', err);
        this.cambiandoRol[usuario.id] = false;
        this.mostrarMensaje('Error al cambiar el rol. Intenta de nuevo.', false);
      }
    });
  }

  private mostrarMensaje(msg: string, exito: boolean): void {
    this.mensajeRol = msg;
    this.mensajeRolExito = exito;
    setTimeout(() => this.mensajeRol = '', 3000);
  }

  getBadgeClass(rol: string): string {
    const mapa: { [key: string]: string } = {
      'ADMIN': 'badge-admin',
      'AGENTE': 'badge-agente',
      'CLIENTE': 'badge-cliente',
      'GERENTE': 'badge-gerente',
      'ASESOR_LEGAL': 'badge-asesor',
      'PENDIENTE': 'badge-pendiente',
      'DESVINCULADO': 'badge-desvinc'
    };
    return mapa[rol] ?? 'badge-default';
  }

  // ─── Logout ──────────────────────────────────────────────────────────
  logout(): void {
    this.chatService.desconectarWebSocket();
    this.authService.logout();
  }
}
