import PropTypes from 'prop-types';
import {
  formatoMoneda,
  formatoFecha,
  etiquetaDescuento,
  precioConDescuento,
} from '../utils/format';
import './CuponBanner.css';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';

// Banner que aclara el descuento del cupón vigente en el detalle de un
// producto o combo. No se renderiza si no hay cupón.
function CuponBanner({ cupon, precioBase }) {
  if (!cupon || !cupon.id_cupon) return null;

  const precioFinal = precioConDescuento(
    precioBase,
    cupon.tipo_descuento,
    cupon.valor_descuento,
  );

  return (
    <div className="cupon-banner">
      <div className="cupon-banner-sello">
        <span className="cupon-banner-sello-icono"><LocalActivityIcon fontSize="large" /></span>
        <span className="cupon-banner-sello-texto">
          {etiquetaDescuento(cupon.tipo_descuento, cupon.valor_descuento)}
        </span>
      </div>

      <div className="cupon-banner-info">
        <h3 className="cupon-banner-titulo">{cupon.nombre}</h3>
        {cupon.descripcion && (
          <p className="cupon-banner-desc">{cupon.descripcion}</p>
        )}

        <div className="cupon-banner-precios">
          <span className="cupon-banner-precio-original">
            {formatoMoneda(precioBase)}
          </span>
          <span className="cupon-banner-flecha">&rarr;</span>
          <span className="cupon-banner-precio-final">
            {formatoMoneda(precioFinal)}
          </span>
        </div>

        <div className="cupon-banner-detalle">
          <span className="cupon-banner-codigo">
            Cupón: <strong>{cupon.codigo}</strong>
          </span>
          {cupon.fecha_fin && (
            <span className="cupon-banner-vigencia">
              Válido hasta el{' '}
              {formatoFecha(String(cupon.fecha_fin).substring(0, 10))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

CuponBanner.propTypes = {
  cupon: PropTypes.object,
  precioBase: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default CuponBanner;
