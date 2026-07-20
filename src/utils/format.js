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

export const extraerErrorAPI = (
  error,
  mensajePorDefecto = 'Ocurrió un error',
) => {
  if (!error) return mensajePorDefecto;
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.errores) {
    const primero = Object.values(data.errores)[0];
    if (typeof primero === 'string') return primero;
  }
  if (data?.mensaje) return data.mensaje;
  return error.response?.statusText || mensajePorDefecto;
};
