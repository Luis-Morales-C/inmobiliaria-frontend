import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import mapboxgl, { LngLatLike } from 'mapbox-gl';
import {CaptacionInmuebleDTO} from './dto/captacion-inmueble-dto';

@Injectable({
  providedIn: 'root'
})
export class MapaService {
  mapa: any;
  marcador: any;
  posicionActual: LngLatLike;
  constructor() {
    //this.marcadores = [];
    this.posicionActual = [-75.67270, 4.53252];
  }
  public crearMapa() {
    try {
      console.log('Creando mapa...');
      const container = document.getElementById('mapa');
      if (!container) {
        console.error('No se encontró el contenedor del mapa con id "mapa"');
        return;
      }

      console.log('Contenedor del mapa encontrado:', container);

      this.mapa = new mapboxgl.Map({
        accessToken: '',
        container: 'mapa',
        style: 'mapbox://styles/mapbox/standard',
        center: this.posicionActual,
        pitch: 45,
        zoom: 17
      });

      console.log('Mapa creado exitosamente');

      this.mapa.addControl(new mapboxgl.NavigationControl());
      this.mapa.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true
        })
      );

      // Agregar un evento para verificar cuando el mapa se carga completamente
      this.mapa.on('load', () => {
        console.log('Mapa cargado completamente');
      });
    } catch (error) {
      console.error('Error al crear el mapa:', error);
    }
  }

  public agregarMarcador(): void {
    if (!this.mapa) {
      console.error('El mapa no ha sido inicializado');
      return;
    }

    const mapaGlobal = this.mapa;

    mapaGlobal.on('click', (e: any) => {
      if (this.marcador) {
        this.marcador.remove();
      }

      this.marcador = new mapboxgl.Marker({color: 'red'})
        .setLngLat([e.lngLat.lng, e.lngLat.lat])
        .addTo(mapaGlobal);
    });
  }

 /* public pintarMarcadores(reportes: CaptacionInmuebleDTO[]) {
    reportes.forEach(reporte => {
      new mapboxgl.Marker({color: 'red'})
        .setLngLat([reporte.ubicacion.longitud, reporte.ubicacion.latitud])
        .setPopup(new mapboxgl.Popup().setHTML(reporte.titulo))
        .addTo(this.mapa);
    });
  }

  */
}
