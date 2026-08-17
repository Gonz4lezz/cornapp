import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { procesoService } from '../services/api';
import './ProcesoDetalle.css';

function ProcesoDetalle() {
  const { id } = useParams();
  const [proceso, setProceso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    procesoService.getById(id)
      .then((res) => {
        setProceso(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar el proceso');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="loading">Cargando proceso...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!proceso) return <div className="error-message">Proceso no encontrado</div>;

  return (
    <div className="proceso-detalle">
      <div className="page-header">
        <Link to="/procesos" className="detalle-volver">&larr; Volver a Procesos</Link>
        <h1>Preparación: {proceso.nombre_producto}</h1>
        <p>Tiempo total estimado: {proceso.tiempo_estimado_total} minutos</p>
      </div>

      <div className="page-content">
        <div className="proceso-timeline">
          {proceso.pasos && proceso.pasos.map((paso, index) => (
            <div key={paso.id_paso} className="paso-item">
              <div className="paso-connector">
                <div
                  className="paso-circle"
                  style={{ backgroundColor: paso.color_estacion || '#FF8E42' }}
                >
                  {paso.orden_paso}
                </div>
                {index < proceso.pasos.length - 1 && <div className="paso-line"></div>}
              </div>

              <div className="paso-content">
                <div className="paso-header">
                  <h3>{paso.nombre_estacion}</h3>
                  <span className="paso-tiempo">⏱ {paso.tiempo_estimado} min</span>
                </div>
                {paso.descripcion_estacion && (
                  <p className="paso-estacion-desc">{paso.descripcion_estacion}</p>
                )}
                {paso.instrucciones && (
                  <div className="paso-instrucciones">
                    <strong>Instrucciones:</strong>
                    <p>{paso.instrucciones}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProcesoDetalle;