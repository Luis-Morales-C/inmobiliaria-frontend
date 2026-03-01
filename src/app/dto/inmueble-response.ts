import {TipoNegocio} from '../modelo/TipoNegocio';
import {TipoInmueble} from '../modelo/TipoInmueble';
import {EstadoInmueble} from '../modelo/EstadoInmueble';
import {EstadoTransaccion} from '../modelo/EstadoTransaccion';
import {AgenteResponse} from './AgenteResponse';

export interface InmuebleResponse {
  longitud: number;
  latitud: number;
  tipoNegocio: TipoNegocio;
  agenteAsociado: AgenteResponse; // ID del agente
  asesorLegal: number;    // ID del asesor legal
  tipo: TipoInmueble;
  medidas: number;
  habitaciones: number;
  banos: number;
  descripcion: string;
  estado: EstadoInmueble;
  precio: number;
  estadoTransa: EstadoTransaccion;
  cantidadParqueaderos: number;
  telefonoContacto: string;
  nombreContacto: string;
  correoContacto: string;
  imagenes: string[];
  id: number;
  propietario: number;
  documentosImportantes: string[];
}
