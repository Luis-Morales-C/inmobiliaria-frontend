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
  mapaDetalle: any;
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
        accessToken: 'pk.eyJ1Ijoibmljb2xhc3BlbmEiLCJhIjoiY21mNW5xeHcyMDNxNTJzcHhqNmNkanptbSJ9.LwkC_ifCLcl9yKbXMZf31w',
        container: 'mapa',
        style: 'mapbox://styles/mapbox/standard',
        center: this.posicionActual,
        pitch: 0,
        zoom: 15
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

  public irAMiUbicacion(): void {

    if (!this.mapa) {
      console.error('El mapa no ha sido inicializado');
      return;
    }

    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Animación suave hacia la ubicación
        this.mapa.flyTo({
          center: [lng, lat],
          zoom: 16,
          essential: true
        });

        // Si ya existe marcador, lo quitamos
        if (this.marcador) {
          this.marcador.remove();
        }

        // Agregamos marcador azul para diferenciar
        this.marcador = new mapboxgl.Marker({ color: 'blue' })
          .setLngLat([lng, lat])
          .addTo(this.mapa);

      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        alert('No se pudo obtener tu ubicación');
      },
      {
        enableHighAccuracy: true
      }
    );
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
  public mostrarInmuebleEnMapa(containerId: string, lat: number, lng: number, titulo: string): void {
    try {
      const container = document.getElementById(containerId);
      if (!container) return;

      // Destruir mapa previo si existe en ese contenedor
      if (this.mapaDetalle) {
        this.mapaDetalle.remove();
      }

      this.mapaDetalle = new mapboxgl.Map({
        accessToken: 'pk.eyJ1Ijoibmljb2xhc3BlbmEiLCJhIjoiY21mNW5xeHcyMDNxNTJzcHhqNmNkanptbSJ9.LwkC_ifCLcl9yKbXMZf31w',
        container: containerId,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        pitch: 0,       // 2D — sin inclinación
        bearing: 0,     // sin rotación
        zoom: 15
      });

      this.mapaDetalle.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

      this.mapaDetalle.on('load', () => {
        new mapboxgl.Marker({ color: '#10bb82' })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<strong style="color:#10bb82">${titulo}</strong>`
            )
          )
          .addTo(this.mapaDetalle);
      });

    } catch (error) {
      console.error('Error al mostrar mapa del inmueble:', error);
    }
  }

  public destruirMapaDetalle(): void {
    if (this.mapaDetalle) {
      this.mapaDetalle.remove();
      this.mapaDetalle = null;
    }
  }

  public volarACiudad(ciudad: string, departamento: string): void {
    if (!this.mapa) return;

    const query = encodeURIComponent(`${ciudad}, ${departamento}, Colombia`);
    const token = 'pk.eyJ1Ijoibmljb2xhc3BlbmEiLCJhIjoiY21mNW5xeHcyMDNxNTJzcHhqNmNkanptbSJ9.LwkC_ifCLcl9yKbXMZf31w';

    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&country=CO&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;

          this.mapa.flyTo({
            center: [lng, lat],
            zoom: 13,
            essential: true
          });

          // Limpiar marcador anterior si existe
          if (this.marcador) {
            this.marcador.remove();
            this.marcador = null;
          }
        }
      })
      .catch(err => console.error('Error geocodificando ciudad:', err));
  }
}
