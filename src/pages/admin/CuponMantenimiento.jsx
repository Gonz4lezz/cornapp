import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cuponService } from '../../services/api';
import {
  formatoFecha,
  etiquetaDescuento,
  extraerErrorAPI,
} from '../../utils/format';
import { useToggleActivo } from '../../hooks/useToggleActivo';
import ConfirmDialog from '../../components/ConfirmDialog';
import './admin-common.css';

function CuponMantenimiento() {
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cuponService
      .getAllMantenimiento()
      .then((res) => setCupones(Array.isArray(res.data) ? res.data : []))
      .catch((err) =>
        toast.error(extraerErrorAPI(err, 'No se pudieron cargar los cupones')),
      )
      .finally(() => setCargando(false));
  }, []);

  const toggle = useToggleActivo({
    service: cuponService,
    idKey: 'id_cupon',
    nombreEntidad: 'Cupón',
    onEstadoCambiado: (id, estado) =>
      setCupones((prev) =>
        prev.map((c) =>
          c.id_cupon === id ? { ...c, esta_activo: estado } : c,
        ),
      ),
  });

  if (cargando) return <div className="loading">Cargando cupones...</div>;

  return (
    <div className="admin-cupones">
      <div className="page-header">
        <Link to="/admin" className="admin-form-back">
          &larr; Volver al panel
        </Link>
        <h1>Mantenimiento de Cupones</h1>
        <p>Administrá los cupones de descuento por producto o combo</p>
      </div>

      <div className="page-content">
        <div className="admin-toolbar">
          <p className="admin-toolbar-titulo">
            {cupones.length} cupones registrados
          </p>
          <Link to="/admin/cupones/nuevo" className="admin-btn">
            + Nuevo cupón
          </Link>
        </div>

        {cupones.length === 0 ? (
          <div className="admin-empty">
            <h3>Sin cupones aún</h3>
            <p>Creá el primer cupón de descuento.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descuento</th>
                  <th>Aplica a</th>
                  <th>Vigencia</th>
                  <th>Estado</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cupones.map((c) => (
                  <tr
                    key={c.id_cupon}
                    style={{ opacity: c.esta_activo == 1 ? 1 : 0.6 }}
                  >
                    <td>
                      <span className="cupon-card-codigo">{c.codigo}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                    <td>
                      {etiquetaDescuento(c.tipo_descuento, c.valor_descuento)}
                    </td>
                    <td>
                      {c.id_producto != null ? (
                        <Link to={`/productos/${c.id_producto}`}>
                          {c.nombre_producto}{' '}
                          <span className="admin-badge">Producto</span>
                        </Link>
                      ) : (
                        <Link to={`/combos/${c.id_combo}`}>
                          {c.nombre_combo}{' '}
                          <span className="admin-badge">Combo</span>
                        </Link>
                      )}
                    </td>
                    <td>
                      {formatoFecha(String(c.fecha_inicio).substring(0, 10))} –{' '}
                      {formatoFecha(String(c.fecha_fin).substring(0, 10))}
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${c.esta_activo == 1 ? 'admin-badge-primary' : ''}`}
                      >
                        {c.esta_activo == 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="col-acciones">
                      <Link
                        to={`/admin/cupones/${c.id_cupon}/editar`}
                        className="admin-btn admin-btn-ghost"
                      >
                        Editar
                      </Link>{' '}
                      <button
                        type="button"
                        className={`admin-btn ${c.esta_activo == 1 ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                        onClick={() => toggle.pedirConfirmacion(c)}
                      >
                        {c.esta_activo == 1 ? 'Desactivar' : 'Activar'}
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
        titulo={toggle.vaADesactivar ? 'Desactivar cupón' : 'Activar cupón'}
        mensaje={
          toggle.vaADesactivar
            ? `¿Desactivar el cupón "${toggle.objetivo?.codigo}"? Dejará de aplicarse, pero podés reactivarlo luego.`
            : `¿Activar el cupón "${toggle.objetivo?.codigo}"? Volverá a estar vigente según sus fechas.`
        }
        textoConfirmar={toggle.vaADesactivar ? 'Desactivar' : 'Activar'}
        colorConfirmar={toggle.vaADesactivar ? 'error' : 'primary'}
        onConfirmar={toggle.confirmar}
        onCancelar={toggle.cancelar}
      />
    </div>
  );
}

export default CuponMantenimiento;
