import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { menuService } from '../../services/api';
import {
  formatoFecha,
  formatoHora,
  formatoDias,
  extraerErrorAPI,
} from '../../utils/format';
import { useToggleActivo } from '../../hooks/useToggleActivo';
import ConfirmDialog from '../../components/ConfirmDialog';
import './admin-common.css';

function MenuMantenimiento() {
  const [menus, setMenus] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    menuService
      .getAllMantenimiento()
      .then((res) => setMenus(Array.isArray(res.data) ? res.data : []))
      .catch((err) =>
        toast.error(extraerErrorAPI(err, 'No se pudieron cargar los menús')),
      )
      .finally(() => setCargando(false));
  }, []);

  const toggle = useToggleActivo({
    service: menuService,
    idKey: 'id_menu',
    nombreEntidad: 'Menú',
    onEstadoCambiado: (id, estado) =>
      setMenus((prev) =>
        prev.map((m) => (m.id_menu === id ? { ...m, esta_activo: estado } : m)),
      ),
  });

  if (cargando) return <div className="loading">Cargando menús...</div>;

  const disponibilidadTexto = (m) => {
    if (m.tipo_disponibilidad === 'dias') {
      return formatoDias(m.dias) || 'Sin días definidos';
    }
    return m.fecha_inicio && m.fecha_fin
      ? `${formatoFecha(m.fecha_inicio)} – ${formatoFecha(m.fecha_fin)}`
      : 'Sin definir';
  };

  return (
    <div className="admin-menus">
      <div className="page-header">
        <Link to="/admin" className="admin-form-back">
          &larr; Volver al panel
        </Link>
        <h1>Mantenimiento de Menús</h1>
        <p>
          Configurá menús con sus productos, combos, disponibilidad y horarios
        </p>
      </div>

      <div className="page-content">
        <div className="admin-toolbar">
          <p className="admin-toolbar-titulo">
            {menus.length} menús registrados
          </p>
          <Link to="/admin/menus/nuevo" className="admin-btn">
            + Nuevo menú
          </Link>
        </div>

        {menus.length === 0 ? (
          <div className="admin-empty">
            <h3>Sin menús aún</h3>
            <p>Creá el primer menú para el catálogo.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Disponibilidad</th>
                  <th>Rango de horas</th>
                  <th>Items</th>
                  <th>Estado</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => (
                  <tr
                    key={m.id_menu}
                    style={{ opacity: m.esta_activo == 1 ? 1 : 0.6 }}
                  >
                    <td>
                      <Link
                        to={`/menus/${m.id_menu}`}
                        style={{ fontWeight: 600 }}
                      >
                        {m.nombre}
                      </Link>
                    </td>
                    <td>
                      {disponibilidadTexto(m)}
                      <span
                        className="admin-badge"
                        style={{ marginLeft: 8, fontSize: '0.7rem' }}
                      >
                        {m.tipo_disponibilidad === 'dias' ? 'Días' : 'Fechas'}
                      </span>
                    </td>
                    <td>
                      {m.hora_inicio && m.hora_fin
                        ? `${formatoHora(m.hora_inicio)} – ${formatoHora(m.hora_fin)}`
                        : 'Sin definir'}
                    </td>
                    <td>{m.total_items} items</td>
                    <td>
                      <span
                        className={`admin-badge ${
                          m.esta_activo == 1 ? 'admin-badge-primary' : ''
                        }`}
                      >
                        {m.esta_activo == 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="col-acciones">
                      <Link
                        to={`/admin/menus/${m.id_menu}/editar`}
                        className="admin-btn admin-btn-ghost"
                      >
                        Editar
                      </Link>{' '}
                      <button
                        type="button"
                        className={`admin-btn ${m.esta_activo == 1 ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                        onClick={() => toggle.pedirConfirmacion(m)}
                      >
                        {m.esta_activo == 1 ? 'Desactivar' : 'Activar'}
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
        titulo={toggle.vaADesactivar ? 'Desactivar menú' : 'Activar menú'}
        mensaje={
          toggle.vaADesactivar
            ? `¿Desactivar el menú "${toggle.objetivo?.nombre}"? Dejará de mostrarse a los clientes, pero podés reactivarlo luego.`
            : `¿Activar el menú "${toggle.objetivo?.nombre}"? Volverá a estar disponible para los clientes.`
        }
        textoConfirmar={toggle.vaADesactivar ? 'Desactivar' : 'Activar'}
        colorConfirmar={toggle.vaADesactivar ? 'error' : 'primary'}
        onConfirmar={toggle.confirmar}
        onCancelar={toggle.cancelar}
      />
    </div>
  );
}

export default MenuMantenimiento;
