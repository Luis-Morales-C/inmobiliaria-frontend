// user.interface.ts

export interface User {
  id: string;
  email: string;
  contrasena: string;
  rol: Rol;
  nombre: string;
  apellido: string;
  documentoIdentidad: string;
  telefono: string;
  codigoActivacion: string;
}

export enum Rol {
  USER = 'USER',
  ADMIN = 'ADMIN',
  AGENTE = 'AGENTE',
  CLIENTE = 'CLIENTE',
  GERENTE = 'GERENTE',
  PENDIENTE = 'PENDIENTE'
}
