import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { procesoService } from '../../services/api';
import { extraerErrorAPI } from '../../utils/format';
import { useToggleActivo } from '../../hooks/useToggleActivo';
import ConfirmDialog from '../../components/ConfirmDialog';
import './admin-common.css';

function ProcesoMantenimiento() {
  const [procesos, setProcesos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    procesoService
      .getAllMantenimiento()
      .then((res) => setProcesos(Array.isArray(res.data) ? res.data : []))
      .catch((err) =>
        toast.error(extraerErrorAPI(err, 'No se pudieron cargar los procesos')),
      )
      .finally(() => setCargando(false));
  }, []);

  const toggle = useToggleActivo({
    service: procesoService,
    idKey: 'id_proceso',
    nombreEntidad: 'Proceso',
    onEstadoCambiado: (id, estado) =>
      setProcesos((prev) =>
        prev.map((p) =>
          p.id_proceso === id ? { ...p, esta_activo: estado } : p,
        ),
      ),
  });

  if (cargando) return <div className="loading">Cargando procesos...</div>;

  return (
    <div className="admin-procesos">
      <div className="page-header">
        <Link to="/admin" className="admin-form-back">
          &larr; Volver al panel
        </Link>
        <h1>Mantenimiento de Procesos de Preparación</h1>
        <p>Definí las estaciones y el orden de preparación de cada producto</p>
      </div>

      <div className="page-content">
        <div className="admin-toolbar">
          <p className="admin-toolbar-titulo">
            {procesos.length} procesos registrados
          </p>
          <Link to="/admin/procesos/nuevo" className="admin-btn">
            + Nuevo proceso
          </Link>
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
                  <th>Estado</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {procesos.map((p) => (
                  <tr
                    key={p.id_proceso}
                    style={{ opacity: p.esta_activo == 1 ? 1 : 0.6 }}
                  >
                    <td>
                      <Link
                        to={`/procesos/${p.id_proceso}`}
                        style={{ fontWeight: 600 }}
                      >
                        {p.nombre_producto}
                      </Link>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-primary">
                        {p.cantidad_pasos}{' '}
                        {p.cantidad_pasos == 1 ? 'estación' : 'estaciones'}
                      </span>
                    </td>
                    <td>{p.tiempo_estimado_total} min</td>
                    <td>
                      <span
                        className={`admin-badge ${p.esta_activo == 1 ? 'admin-badge-primary' : ''}`}
                      >
                        {p.esta_activo == 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="col-acciones">
                      <Link
                        to={`/admin/procesos/${p.id_proceso}/editar`}
                        className="admin-btn admin-btn-ghost"
                      >
                        Editar
                      </Link>{' '}
                      <button
                        type="button"
                        className={`admin-btn ${p.esta_activo == 1 ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                        onClick={() => toggle.pedirConfirmacion(p)}
                      >
                        {p.esta_activo == 1 ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toggle.objetivo)}
        titulo={toggle.vaADesactivar ? 'Desactivar proceso' : 'Activar proceso'}
        mensaje={
          toggle.vaADesactivar
            ? `¿Desactivar el proceso de "${toggle.objetivo?.nombre_producto}"? Dejará de mostrarse, pero podés reactivarlo luego.`
            : `¿Activar el proceso de "${toggle.objetivo?.nombre_producto}"? Volverá a estar disponible.`
        }
        textoConfirmar={toggle.vaADesactivar ? 'Desactivar' : 'Activar'}
        colorConfirmar={toggle.vaADesactivar ? 'error' : 'primary'}
        onConfirmar={toggle.confirmar}
        onCancelar={toggle.cancelar}
      />
    </div>
  );
}

export default ProcesoMantenimiento;
