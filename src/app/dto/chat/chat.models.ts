// src/app/dto/chat/mensaje.dto.ts
export interface MensajeDto {
  id: number;
  conversacionId: number;
  emisorId: number;
  emisorNombre: string;
  emisorApellido: string;
  receptorId: number;
  contenido: string;
  enviadoEn: string; // ISO string
  leido: boolean;
}

// src/app/dto/chat/conversacion.dto.ts
export interface ConversacionDto {
  id: number;
  otroUsuarioId: number;
  otroUsuarioNombre: string;
  otroUsuarioApellido: string;
  ultimoMensaje: string;
  ultimoMensajeEn: string | null;
  noLeidosPorMi: number;
}

// src/app/dto/chat/conversacion-detalle.dto.ts
export interface ConversacionDetalleDto {
  id: number;
  otroUsuarioId: number;
  otroUsuarioNombre: string;
  otroUsuarioApellido: string;
  mensajes: MensajeDto[];
}

// src/app/dto/chat/enviar-mensaje-request.dto.ts
export interface EnviarMensajeRequest {
  conversacionId: number | null;
  receptorId: number;
  contenido: string;
}

// src/app/dto/chat/notificacion.dto.ts
export interface NotificacionDto {
  conversacionId: number;
  emisorId: number;
  emisorNombre: string;
  contenidoPreview: string;
  totalNoLeidos: number;
}
