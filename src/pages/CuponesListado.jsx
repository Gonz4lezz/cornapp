import { useState, useEffect } from 'react';
import { cuponService } from '../services/api';
import CuponCard from '../components/CuponCard';
import './CuponesListado.css';

function CuponesListado() {
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cuponService
      .getDisponibles()
      .then((res) => {
        setCupones(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar los cupones');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Cargando cupones...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="cupones-listado">
      <div className="page-header">
        <h1>Cupones de Descuento</h1>
        <p>Aprovechá nuestros descuentos disponibles en productos y combos</p>
      </div>

      <div className="page-content">
        {cupones.length === 0 ? (
          <div className="cupones-vacio">
            <span className="cupones-vacio-icono">🎟️</span>
            <h3>No hay cupones disponibles</h3>
            <p>Volvé pronto, seguimos preparando nuevas promociones.</p>
          </div>
        ) : (
          <div className="cupones-grid">
            {cupones.map((cupon) => (
              <CuponCard key={cupon.id_cupon} cupon={cupon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CuponesListado;
