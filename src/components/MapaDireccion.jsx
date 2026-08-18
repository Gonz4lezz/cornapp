import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import {
  ICONO_DESTINO,
  ICONO_RESTAURANTE,
  UBICACION_POR_DEFECTO,
  obtenerDireccion,
} from '../utils/mapa';
import './MapaDireccion.css';

// Centra el mapa cuando cambia el punto marcado
function CentrarEn({ punto }) {
  const mapa = useMap();
  useEffect(() => {
    if (punto) mapa.setView([punto.latitud, punto.longitud], mapa.getZoom());
  }, [punto, mapa]);
  return null;
}

CentrarEn.propTypes = {
  punto: PropTypes.shape({
    latitud: PropTypes.number,
    longitud: PropTypes.number,
  }),
};

// Marca la dirección donde el usuario hace clic
function ClicEnMapa({ onMarcar }) {
  useMapEvents({
    click: (evento) => onMarcar(evento.latlng.lat, evento.latlng.lng),
  });
  return null;
}

ClicEnMapa.propTypes = { onMarcar: PropTypes.func.isRequired };


function MapaDireccion({ restaurante, punto, onCambio, alcanceKm }) {
  const [ubicando, setUbicando] = useState(false);
  const intentoAutomatico = useRef(false);

  const centro = punto ?? restaurante ?? UBICACION_POR_DEFECTO;

  // Marca un punto y busca su dirección legible
  const marcar = useCallback(
    async (latitud, longitud) => {
      onCambio({ latitud, longitud, direccion: '', buscandoDireccion: true });
      const direccion = await obtenerDireccion(latitud, longitud);
      onCambio({ latitud, longitud, direccion, buscandoDireccion: false });
    },
    [onCambio],
  );

  const ubicarme = useCallback(
    (silencioso = false) => {
      if (!navigator.geolocation) {
        if (!silencioso) {
          toast.error('Su navegador no permite obtener la ubicación');
        }
        return;
      }
      setUbicando(true);
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          setUbicando(false);
          marcar(posicion.coords.latitude, posicion.coords.longitude);
        },
        () => {
          setUbicando(false);
          if (!silencioso) {
            toast.error(
              'No se pudo obtener su ubicación. Marque la dirección en el mapa.',
            );
          }
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    },
    [marcar],
  );

  // Primer intento automático al abrir el mapa
  useEffect(() => {
    if (intentoAutomatico.current || punto) return;
    intentoAutomatico.current = true;
    ubicarme(true);
  }, [ubicarme, punto]);

  return (
    <div className="mapa-direccion">
      <div className="mapa-direccion-barra">
        <span className="mapa-direccion-ayuda">
          Haga clic en el mapa para marcar la dirección de entrega
        </span>
        <button
          type="button"
          className="mapa-direccion-boton"
          onClick={() => ubicarme(false)}
          disabled={ubicando}
        >
          {ubicando ? 'Buscando…' : 'Usar mi ubicación actual'}
        </button>
      </div>

      <MapContainer
        center={[centro.latitud, centro.longitud]}
        zoom={14}
        className="mapa-direccion-lienzo"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClicEnMapa onMarcar={marcar} />
        <CentrarEn punto={punto} />

        {restaurante && (
          <>
            <Marker
              position={[restaurante.latitud, restaurante.longitud]}
              icon={ICONO_RESTAURANTE}
            />
            {alcanceKm > 0 && (
              <Circle
                center={[restaurante.latitud, restaurante.longitud]}
                radius={alcanceKm * 1000}
                pathOptions={{
                  color: '#FF8E42',
                  weight: 1,
                  fillOpacity: 0.06,
                }}
              />
            )}
          </>
        )}

        {punto && (
          <Marker
            position={[punto.latitud, punto.longitud]}
            icon={ICONO_DESTINO}
          />
        )}
      </MapContainer>
    </div>
  );
}

MapaDireccion.propTypes = {
  restaurante: PropTypes.shape({
    latitud: PropTypes.number,
    longitud: PropTypes.number,
  }),
  punto: PropTypes.shape({
    latitud: PropTypes.number,
    longitud: PropTypes.number,
  }),
  onCambio: PropTypes.func.isRequired,
  alcanceKm: PropTypes.number,
};

export default MapaDireccion;
