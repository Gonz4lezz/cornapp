import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import './BotonAgregarCarrito.css';

// Botón "Agregar al carrito" con selector de cantidad opcional.
// Si no hay sesión, invita a iniciar sesión primero.
function BotonAgregarCarrito({
  idProducto = null,
  idCombo = null,
  nombre,
  conCantidad = false,
}) {
  const navigate = useNavigate();
  const { usuario, puedeComprar } = useAuth();
  const { agregar } = useCarrito();
  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);

  // El rol Cocina no realiza compras
  if (usuario && !puedeComprar) return null;

  const alAgregar = async () => {
    if (!usuario) {
      toast('Inicia sesión para agregar artículos al carrito', { icon: '🔒' });
      navigate('/login');
      return;
    }
    setAgregando(true);
    await agregar(
      {
        id_producto: idProducto || undefined,
        id_combo: idCombo || undefined,
        cantidad,
      },
      nombre,
    );
    setCantidad(1);
    setAgregando(false);
  };

  return (
    <div className="agregar-carrito">
      {conCantidad && (
        <div className="agregar-carrito-cantidad">
          <button
            type="button"
            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
            aria-label="Disminuir cantidad"
          >
            −
          </button>
          <span>{cantidad}</span>
          <button
            type="button"
            onClick={() => setCantidad((c) => Math.min(99, c + 1))}
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
      )}
      <button
        type="button"
        className="agregar-carrito-boton"
        onClick={alAgregar}
        disabled={agregando}
      >
        🛒 {agregando ? 'Agregando…' : 'Agregar al carrito'}
      </button>
    </div>
  );
}

BotonAgregarCarrito.propTypes = {
  idProducto: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  idCombo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  nombre: PropTypes.string.isRequired,
  conCantidad: PropTypes.bool,
};

export default BotonAgregarCarrito;
