import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { RedireccionService } from '../../servicios/redireccion.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.css']
})
export class UserMenuComponent implements OnInit {
  @Input() userName: string = '';
  @Output() logout = new EventEmitter<void>();

  // Nueva variable para controlar la vista
  isAdmin: boolean = false;

  private readonly ROLES_KEY = 'roles';

  constructor(protected redireccionamiento: RedireccionService) {}

  ngOnInit(): void {
    // Leemos los roles al cargar el componente
    const roles: string[] = JSON.parse(localStorage.getItem(this.ROLES_KEY) || '[]');
    // Verificamos si el arreglo incluye el rol de ADMIN.
    // (Nota: Asegúrate de que se guarde exactamente como 'ADMIN' o cámbialo a 'ROLE_ADMIN' si tu backend lo envía así)
    this.isAdmin = roles.includes('ADMIN');
  }

  onLogout() {
    this.logout.emit();
  }

  mostrarRolPrincipal(): void {
    const roles = JSON.parse(localStorage.getItem(this.ROLES_KEY) || '[]');
    const primerRol = roles[0];
    console.log('Primer rol:', primerRol);

    this.redireccionamiento.redirigirSegunRol(primerRol);
  }
}
