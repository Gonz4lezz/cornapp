import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { comboService, resolveImageUrl } from '../services/api';
import { formatoMoneda } from '../utils/format';
import './ComboListado.css';

function ComboListado() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    comboService.getAll()
      .then((res) => {
        setCombos(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar los combos');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Cargando combos...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="combo-listado">
      <div className="page-header">
        <h1>Nuestros Combos</h1>
        <p>Combinaciones especiales a precio irresistible</p>
      </div>

      <div className="page-content">
        <div className="combos-grid">
          {combos.map((combo) => (
            <Link
              to={`/combos/${combo.id_combo}`}
              key={combo.id_combo}
              className="combo-card"
            >
              <div className="combo-card-img">
                {combo.imagen ? (
                  <img src={resolveImageUrl(combo.imagen)} alt={combo.nombre} />
                ) : (
                  <div className="combo-card-placeholder"></div>
                )}
                <span className="combo-card-badge">Combo</span>
              </div>
              <div className="combo-card-body">
                <h3 className="combo-card-nombre">{combo.nombre}</h3>
                <p className="combo-card-descripcion">
                  {combo.descripcion && combo.descripcion.length > 90
                    ? combo.descripcion.substring(0, 90) + '...'
                    : combo.descripcion}
                </p>
                <span className="combo-card-precio">{formatoMoneda(combo.precio_combo)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ComboListado;