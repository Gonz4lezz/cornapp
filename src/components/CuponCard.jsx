import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { resolveImageUrl } from '../services/api';
import { precioConDescuento, formatoMoneda } from '../utils/format';
import './CuponCard.css';

// Card de un cupón. Al hacer clic lleva al producto o combo asociado.
function CuponCard({ cupon }) {
  const esProducto = cupon.id_producto != null;
  const destino = esProducto
    ? `/productos/${cupon.id_producto}`
    : `/combos/${cupon.id_combo}`;
  const nombreItem = esProducto ? cupon.nombre_producto : cupon.nombre_combo;
  const precioBase = esProducto ? cupon.precio_producto : cupon.precio_combo;
  const precioFinal = precioConDescuento(
    precioBase,
    cupon.tipo_descuento,
    cupon.valor_descuento,
  );

  return (
    <Link to={destino} className="cupon-card">
      <div className="cupon-card-descuento">
        <span className="cupon-card-descuento-valor">
          {cupon.tipo_descuento === 'porcentaje'
            ? `-${Number(cupon.valor_descuento) % 1 === 0 ? Number(cupon.valor_descuento) : Number(cupon.valor_descuento).toFixed(0)}%`
            : `-${formatoMoneda(cupon.valor_descuento)}`}
        </span>
        <span className="cupon-card-descuento-label">DESCUENTO</span>
      </div>

      <div className="cupon-card-img">
        {cupon.imagen ? (
          <img src={resolveImageUrl(cupon.imagen)} alt={nombreItem} />
        ) : (
          <div className="cupon-card-img-placeholder">🎟️</div>
        )}
      </div>

      <div className="cupon-card-body">
        <span className="cupon-card-tipo">
          {esProducto ? 'Producto' : 'Combo'}
        </span>
        <h3 className="cupon-card-nombre">{cupon.nombre}</h3>
        <p className="cupon-card-item">{nombreItem}</p>

        {precioBase != null && (
          <div className="cupon-card-precios">
            <span className="cupon-card-precio-original">
              {formatoMoneda(precioBase)}
            </span>
            <span className="cupon-card-precio-final">
              {formatoMoneda(precioFinal)}
            </span>
          </div>
        )}

        <div className="cupon-card-footer">
          <span className="cupon-card-codigo">{cupon.codigo}</span>
          <span className="cupon-card-ver">
            Ver {esProducto ? 'producto' : 'combo'} &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

CuponCard.propTypes = {
  cupon: PropTypes.shape({
    id_cupon: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    codigo: PropTypes.string,
    nombre: PropTypes.string,
    tipo_descuento: PropTypes.string,
    valor_descuento: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id_producto: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id_combo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nombre_producto: PropTypes.string,
    nombre_combo: PropTypes.string,
    precio_producto: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    precio_combo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    imagen: PropTypes.string,
  }).isRequired,
};

export default CuponCard;
