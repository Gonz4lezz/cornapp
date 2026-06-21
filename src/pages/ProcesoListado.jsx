import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { procesoService } from '../services/api';
import './ProcesoListado.css';

function ProcesoListado() {
  const [procesos, setProcesos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    procesoService.getAll()
      .then((res) => {
        setProcesos(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar los procesos de preparación');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Cargando procesos...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="proceso-listado">
      <div className="page-header">
        <h1>Procesos de Preparación</h1>
        <p>Conocé cómo se preparan nuestros productos paso a paso</p>
      </div>

      <div className="page-content">
        <div className="procesos-lista">
          {procesos.map((proceso) => (
            <Link
              to={`/procesos/${proceso.id_proceso}`}
              key={proceso.id_proceso}
              className="proceso-card"
            >
              <div className="proceso-card-icon">🍳</div>
              <div className="proceso-card-info">
                <h3>{proceso.nombre_producto}</h3>
                <div className="proceso-card-meta">
                  <span className="proceso-card-pasos">
                    {proceso.cantidad_pasos} {proceso.cantidad_pasos == 1 ? 'estación' : 'estaciones'}
                  </span>
                  <span className="proceso-card-tiempo">
                    ⏱ {proceso.tiempo_estimado_total} min
                  </span>
                </div>
              </div>
              <span className="proceso-card-arrow">&rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProcesoListado;
