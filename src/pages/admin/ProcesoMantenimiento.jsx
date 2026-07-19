import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { procesoService } from '../../services/api';
import { extraerErrorAPI } from '../../utils/format';
import './admin-common.css';

function ProcesoMantenimiento() {
  const [procesos, setProcesos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    procesoService
      .getAll()
      .then((res) => setProcesos(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(extraerErrorAPI(err, 'No se pudieron cargar los procesos')))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="loading">Cargando procesos...</div>;

  return (
    <div className="admin-procesos">
      <div className="page-header">
        <Link to="/admin" className="admin-form-back">&larr; Volver al panel</Link>
        <h1>Mantenimiento de Procesos de Preparación</h1>
        <p>Definí las estaciones y el orden de preparación de cada producto</p>
      </div>

      <div className="page-content">
        <div className="admin-toolbar">
          <p className="admin-toolbar-titulo">{procesos.length} procesos registrados</p>
          <Link to="/admin/procesos/nuevo" className="admin-btn">+ Nuevo proceso</Link>
        </div>

        {procesos.length === 0 ? (
          <div className="admin-empty">
            <h3>Sin procesos aún</h3>
            <p>Creá el primer proceso de preparación.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad de pasos</th>
                  <th>Tiempo estimado total</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {procesos.map((p) => (
                  <tr key={p.id_proceso}>
                    <td>
                      <Link to={`/procesos/${p.id_proceso}`} style={{ fontWeight: 600 }}>
                        {p.nombre_producto}
                      </Link>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-primary">
                        {p.cantidad_pasos} {p.cantidad_pasos == 1 ? 'estación' : 'estaciones'}
                      </span>
                    </td>
                    <td>{p.tiempo_estimado_total} min</td>
                    <td className="col-acciones">
                      <Link
                        to={`/admin/procesos/${p.id_proceso}/editar`}
                        className="admin-btn admin-btn-ghost"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProcesoMantenimiento;
