export interface CaptacionInmuebleDTO {

  latitud: number;
  longitud: number;
  tipoNegocio: string;
  tipo: string,
  medidas: number,
  habitaciones: number,
  banos: number,
  descripcion: string,
  precio: number,
  cantidadParqueaderos: number,
  telefonoContacto: string,
  nombreContacto: string,
  correoContacto: string,
  estado: string,

  /*Los siguientes datos seran determinados en el back-end:
    --Los datos del agente inmobiliario
    --Historial inmueble
    --Los datos del asesor legal

    Los siguientes datos seran determinados con el agente inmobiliario via whatsapp:
    --Documentos improtantes
   */
}
