export const formatoMoneda = (valor) => {
  const num = Number(valor);
  if (isNaN(num)) return '₡0';
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatoFecha = (valor) => {
  if (!valor) return '';
  const fecha = new Date(`${valor}T00:00:00`);
  if (isNaN(fecha.getTime())) return valor;
  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
};

// Fecha y hora completas (para timestamps tipo "2026-08-06 14:30:00")
export const formatoFechaHora = (valor) => {
  if (!valor) return '';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  if (isNaN(fecha.getTime())) return valor;
  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(fecha);
};

export const formatoHora = (valor) => {
  if (!valor) return '';
  const partes = valor.split(':');
  if (partes.length < 2) return valor;
  const h = parseInt(partes[0], 10);
  const m = partes[1].padStart(2, '0');
  const sufijo = h >= 12 ? 'p.m.' : 'a.m.';
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  return `${hora12}:${m} ${sufijo}`;
};

// Días de la semana (0=Domingo ... 6=Sábado)
export const DIAS_SEMANA = [
  { valor: 0, nombre: 'Domingo', corto: 'Dom' },
  { valor: 1, nombre: 'Lunes', corto: 'Lun' },
  { valor: 2, nombre: 'Martes', corto: 'Mar' },
  { valor: 3, nombre: 'Miércoles', corto: 'Mié' },
  { valor: 4, nombre: 'Jueves', corto: 'Jue' },
  { valor: 5, nombre: 'Viernes', corto: 'Vie' },
  { valor: 6, nombre: 'Sábado', corto: 'Sáb' },
];

// Convierte un arreglo de días [1,2,3] en "Lun, Mar, Mié" (ordenado)
export const formatoDias = (dias) => {
  if (!Array.isArray(dias) || dias.length === 0) return '';
  return dias
    .map((d) => Number(d))
    .sort((a, b) => a - b)
    .map((d) => DIAS_SEMANA.find((x) => x.valor === d)?.corto || '')
    .filter(Boolean)
    .join(', ');
};

// Etiqueta legible del descuento de un cupón (ej: "15% de descuento" o "₡500 de descuento")
export const etiquetaDescuento = (tipoDescuento, valor) => {
  const num = Number(valor) || 0;
  if (tipoDescuento === 'porcentaje') {
    return `${num % 1 === 0 ? num : num.toFixed(0)}% de descuento`;
  }
  return `${formatoMoneda(num)} de descuento`;
};

// Precio final aplicando el descuento del cupón (nunca menor a 0)
export const precioConDescuento = (precioBase, tipoDescuento, valor) => {
  const precio = Number(precioBase) || 0;
  const num = Number(valor) || 0;
  let final = precio;
  if (tipoDescuento === 'porcentaje') {
    final = precio - (precio * num) / 100;
  } else {
    final = precio - num;
  }
  return final < 0 ? 0 : final;
};

/**
 * Cuando la respuesta se pidió como blob (por ejemplo el PDF de la factura),
 * el mensaje de error también llega como blob y hay que leerlo para poder
 * mostrarlo.
 */
export const extraerErrorBlob = async (
  error,
  mensajePorDefecto = 'Ocurrió un error',
) => {
  const data = error?.response?.data;
  if (!(data instanceof Blob)) return extraerErrorAPI(error, mensajePorDefecto);
  try {
    const contenido = JSON.parse(await data.text());
    if (typeof contenido === 'string') return contenido;
    return contenido?.mensaje || mensajePorDefecto;
  } catch {
    return mensajePorDefecto;
  }
};

export const extraerErrorAPI = (
  error,
  mensajePorDefecto = 'Ocurrió un error',
) => {
  if (!error) return mensajePorDefecto;
  // Sin respuesta del servidor: Apache apagado, ruta equivocada o CORS
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Verifique que el servicio esté disponible.';
  }
  const data = error.response.data;
  if (typeof data === 'string') return data;
  if (data?.errores) {
    const primero = Object.values(data.errores)[0];
    if (typeof primero === 'string') return primero;
  }
  if (data?.mensaje) return data.mensaje;
  // El enrutador devuelve los errores del servidor en la propiedad result
  if (typeof data?.result === 'string') return data.result;
  return error.response.statusText || mensajePorDefecto;
};
