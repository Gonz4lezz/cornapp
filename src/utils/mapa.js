import L from 'leaflet';

// Ubicación del local por defecto (Alajuela centro). El servidor manda la
// real en los catálogos del pedido; esta sirve solo como punto de partida
// del mapa mientras esa respuesta llega.
export const UBICACION_POR_DEFECTO = { latitud: 10.0162, longitud: -84.2116 };

/**
 * Íconos del mapa. Se construyen con divIcon (HTML) en vez de imágenes
 * porque los íconos que trae Leaflet se rompen al empaquetar con Vite.
 */
const crearIcono = (contenido, color, tamano = 34) =>
  L.divIcon({
    className: 'mapa-icono',
    html: `<span class="mapa-pin" style="--pin-color:${color}">${contenido}</span>`,
    iconSize: [tamano, tamano],
    iconAnchor: [tamano / 2, tamano / 2],
    popupAnchor: [0, -tamano / 2],
  });

export const ICONO_RESTAURANTE = crearIcono('🏪', '#211206');
export const ICONO_DESTINO = crearIcono('📍', '#FF8E42');
export const ICONO_REPARTIDOR = crearIcono('🛵', '#047857', 38);

/**
 * Convierte unas coordenadas en una dirección legible usando Nominatim,
 * el servicio de geocodificación de OpenStreetMap (gratuito y sin llave).
 * Si no responde, devuelve las coordenadas formateadas para que el usuario
 * igual pueda continuar con su pedido.
 */
export const obtenerDireccion = async (latitud, longitud) => {
  const coordenadas = `Ubicación marcada en el mapa (${latitud.toFixed(5)}, ${longitud.toFixed(5)})`;
  try {
    const url =
      'https://nominatim.openstreetmap.org/reverse?format=jsonv2' +
      `&lat=${latitud}&lon=${longitud}&accept-language=es`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) return coordenadas;
    const datos = await respuesta.json();
    return datos.display_name || coordenadas;
  } catch {
    return coordenadas;
  }
};

/**
 * Traza la ruta entre dos puntos con OSRM, el servicio de ruteo de
 * OpenStreetMap. Devuelve la lista de coordenadas del camino.
 * Si el servicio no está disponible, devuelve la línea recta entre ambos
 * puntos para que el mapa siga siendo útil.
 */
export const obtenerRuta = async (desde, hasta) => {
  const lineaRecta = {
    coordenadas: [
      [desde.latitud, desde.longitud],
      [hasta.latitud, hasta.longitud],
    ],
    esAproximada: true,
  };

  try {
    const url =
      'https://router.project-osrm.org/route/v1/driving/' +
      `${desde.longitud},${desde.latitud};${hasta.longitud},${hasta.latitud}` +
      '?overview=full&geometries=geojson';
    const respuesta = await fetch(url);
    if (!respuesta.ok) return lineaRecta;

    const datos = await respuesta.json();
    const ruta = datos.routes?.[0];
    if (!ruta?.geometry?.coordinates?.length) return lineaRecta;

    return {
      // OSRM entrega [longitud, latitud]; Leaflet espera [latitud, longitud]
      coordenadas: ruta.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distanciaKm: Math.round((ruta.distance / 1000) * 100) / 100,
      duracionMin: Math.round(ruta.duration / 60),
      esAproximada: false,
    };
  } catch {
    return lineaRecta;
  }
};

/**
 * Posición del repartidor sobre la ruta según el avance del recorrido.
 * progreso va de 0 (aún en el local) a 1 (llegó al destino).
 */
export const puntoEnRuta = (coordenadas, progreso) => {
  if (!coordenadas?.length) return null;
  if (progreso <= 0) return coordenadas[0];
  if (progreso >= 1) return coordenadas[coordenadas.length - 1];

  // Se recorre la ruta acumulando distancia hasta alcanzar el porcentaje
  const tramos = [];
  let total = 0;
  for (let i = 1; i < coordenadas.length; i++) {
    const [lat1, lng1] = coordenadas[i - 1];
    const [lat2, lng2] = coordenadas[i];
    const largo = Math.hypot(lat2 - lat1, lng2 - lng1);
    total += largo;
    tramos.push(largo);
  }
  if (total === 0) return coordenadas[0];

  let recorrido = progreso * total;
  for (let i = 0; i < tramos.length; i++) {
    if (recorrido <= tramos[i]) {
      const fraccion = tramos[i] === 0 ? 0 : recorrido / tramos[i];
      const [lat1, lng1] = coordenadas[i];
      const [lat2, lng2] = coordenadas[i + 1];
      return [lat1 + (lat2 - lat1) * fraccion, lng1 + (lng2 - lng1) * fraccion];
    }
    recorrido -= tramos[i];
  }
  return coordenadas[coordenadas.length - 1];
};

/**
 * Avance del envío (0 a 1) según el tiempo transcurrido desde que el pedido
 * salió del local y la duración estimada del recorrido.
 */
export const progresoEnvio = (salida, duracionMin) => {
  if (!salida) return 0;
  const inicio = new Date(String(salida).replace(' ', 'T')).getTime();
  if (isNaN(inicio)) return 0;
  const minutos = Math.max(1, Number(duracionMin) || 1);
  const transcurrido = (Date.now() - inicio) / 60000;
  return Math.min(1, Math.max(0, transcurrido / minutos));
};

// Minutos que faltan para que llegue el pedido
export const minutosRestantes = (salida, duracionMin) => {
  const restante =
    (1 - progresoEnvio(salida, duracionMin)) * (Number(duracionMin) || 0);
  return Math.max(0, Math.ceil(restante));
};
