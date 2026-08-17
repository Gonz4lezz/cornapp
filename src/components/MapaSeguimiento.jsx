import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ICONO_DESTINO,
  ICONO_REPARTIDOR,
  ICONO_RESTAURANTE,
  minutosRestantes,
  obtenerRuta,
  progresoEnvio,
  puntoEnRuta,
} from '../utils/mapa';
import './MapaDireccion.css';

const INTERVALO_AVANCE = 5000; // ms: cada cuánto se recalcula la posición

/**
 * Mapa de seguimiento del pedido a domicilio: muestra el local, el destino,
 * el camino entre ambos y el repartidor avanzando por la ruta.
 *
 * La posición del repartidor se calcula a partir del tiempo transcurrido
 * desde que el pedido salió del local y la duración estimada del recorrido,
 * porque no contamos con una aplicación de repartidor que envíe su GPS.
 */
function MapaSeguimiento({ restaurante, destino, envio, entregado }) {
  const [ruta, setRuta] = useState(null);
  const [ahora, setAhora] = useState(Date.now());

  // Traza el camino una sola vez por pedido
  useEffect(() => {
    let cancelado = false;
    obtenerRuta(restaurante, destino).then((resultado) => {
      if (!cancelado) setRuta(resultado);
    });
    return () => {
      cancelado = true;
    };
  }, [restaurante, destino]);

  // Mientras el pedido va en camino, la posición se refresca sola
  const enCamino = Boolean(envio?.tstamp_salida) && !entregado;
  useEffect(() => {
    if (!enCamino) return undefined;
    const intervalo = setInterval(() => setAhora(Date.now()), INTERVALO_AVANCE);
    return () => clearInterval(intervalo);
  }, [enCamino]);

  const progreso = useMemo(() => {
    if (entregado) return 1;
    if (!envio?.tstamp_salida) return 0;
    // `ahora` fuerza el recálculo periódico de la posición
    return progresoEnvio(envio.tstamp_salida, envio.duracion_estimada_min);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envio, entregado, ahora]);

  const posicionRepartidor = useMemo(
    () => (ruta ? puntoEnRuta(ruta.coordenadas, progreso) : null),
    [ruta, progreso],
  );

  const faltan = enCamino
    ? minutosRestantes(envio.tstamp_salida, envio.duracion_estimada_min)
    : null;

  const mensajeEstado = entregado
    ? 'Pedido entregado'
    : enCamino
      ? 'Pedido en camino'
      : 'El pedido aún no ha salido del local';

  return (
    <div className="mapa-seguimiento">
      <div className="mapa-seguimiento-barra">
        <span className="mapa-seguimiento-estado">{mensajeEstado}</span>
        <span className="mapa-seguimiento-dato">
          Distancia:{' '}
          <strong>{Number(envio?.distancia_km ?? 0).toFixed(2)} km</strong>
          {faltan !== null && (
            <>
              {' · '}Llega en <strong>{faltan} min</strong>
            </>
          )}
        </span>
      </div>

      <MapContainer
        bounds={[
          [restaurante.latitud, restaurante.longitud],
          [destino.latitud, destino.longitud],
        ]}
        boundsOptions={{ padding: [40, 40] }}
        className="mapa-seguimiento-lienzo"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {ruta && (
          <Polyline
            positions={ruta.coordenadas}
            pathOptions={{
              color: '#FF8E42',
              weight: 5,
              opacity: 0.85,
              dashArray: ruta.esAproximada ? '8 10' : undefined,
            }}
          />
        )}

        <Marker
          position={[restaurante.latitud, restaurante.longitud]}
          icon={ICONO_RESTAURANTE}
        >
          <Popup>{restaurante.nombre || 'CornApp'}</Popup>
        </Marker>

        <Marker
          position={[destino.latitud, destino.longitud]}
          icon={ICONO_DESTINO}
        >
          <Popup>{envio?.direccion_texto || 'Dirección de entrega'}</Popup>
        </Marker>

        {posicionRepartidor && envio?.tstamp_salida && (
          <Marker position={posicionRepartidor} icon={ICONO_REPARTIDOR}>
            <Popup>
              {envio.repartidor
                ? `Repartidor: ${envio.repartidor}`
                : 'Repartidor en ruta'}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {ruta?.esAproximada && (
        <p className="mapa-seguimiento-aviso">
          El servicio de rutas no está disponible en este momento, por lo que se
          muestra el trazo directo entre el local y la dirección de entrega.
        </p>
      )}
    </div>
  );
}

MapaSeguimiento.propTypes = {
  restaurante: PropTypes.shape({
    nombre: PropTypes.string,
    latitud: PropTypes.number.isRequired,
    longitud: PropTypes.number.isRequired,
  }).isRequired,
  destino: PropTypes.shape({
    latitud: PropTypes.number.isRequired,
    longitud: PropTypes.number.isRequired,
  }).isRequired,
  envio: PropTypes.shape({
    direccion_texto: PropTypes.string,
    distancia_km: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    duracion_estimada_min: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
    repartidor: PropTypes.string,
    tstamp_salida: PropTypes.string,
  }),
  entregado: PropTypes.bool,
};

export default MapaSeguimiento;
