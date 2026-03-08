import {TipoNegocio} from '../modelo/TipoNegocio';
import {TipoInmueble} from '../modelo/TipoInmueble';
import {EstadoInmueble} from '../modelo/EstadoInmueble';
import {EstadoTransaccion} from '../modelo/EstadoTransaccion';
import {AgenteResponse} from './AgenteResponse';
import {AsesorResponse} from './AsesorResponse';
import {PropietarioResponse} from './PropietarioResponse';

export interface InmuebleResponse {
  longitud: number;
  latitud: number;
  tipoNegocio: TipoNegocio;
  agenteAsociado: AgenteResponse; // ID del agente
  asesorLegal: AsesorResponse;    // ID del asesor legal
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
  propietario: PropietarioResponse; // ID del propietario
  documentosImportantes: string[];
}
