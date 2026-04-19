import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RedireccionService } from '../../servicios/redireccion.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.css']
})
export class UserMenuComponent {
  @Input() userName: string = '';
  @Output() logout = new EventEmitter<void>();

  private readonly ROLES_KEY = 'roles';

  constructor(protected redireccionamiento: RedireccionService) {}

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
