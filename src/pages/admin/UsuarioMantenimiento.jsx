import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TextField, MenuItem } from '@mui/material';
import { usuarioService } from '../../services/api';
import { formatoFechaHora, extraerErrorAPI } from '../../utils/format';
import { useToggleActivo } from '../../hooks/useToggleActivo';
import ConfirmDialog from '../../components/ConfirmDialog';
import './admin-common.css';

function UsuarioMantenimiento() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filtroRol, setFiltroRol] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await usuarioService.getAll(filtroRol || null);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(extraerErrorAPI(err, 'No se pudieron cargar los usuarios'));
    } finally {
      setCargando(false);
    }
  }, [filtroRol]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    usuarioService
      .getRoles()
      .then(({ data }) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const toggle = useToggleActivo({
    service: usuarioService,
    idKey: 'id_usuario',
    nombreEntidad: 'Usuario',
    onEstadoCambiado: (id, estado) =>
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id_usuario === id ? { ...u, esta_activo: estado } : u,
        ),
      ),
  });

  return (
    <div className="admin-usuarios">
      <div className="page-header">
        <Link to="/admin" className="admin-form-back">
          &larr; Volver al panel
        </Link>
        <h1>Mantenimiento de Usuarios</h1>
        <p>
          Consultá las cuentas registradas y creá el personal del restaurante
        </p>
      </div>

      <div className="page-content">
        <div className="admin-toolbar">
          <TextField
            size="small"
            select
            label="Filtrar por rol"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            style={{ minWidth: '220px' }}
          >
            <MenuItem value="">Todos los roles</MenuItem>
            {roles.map((rol) => (
              <MenuItem key={rol.id_rol} value={rol.id_rol}>
                {rol.nombre}
              </MenuItem>
            ))}
          </TextField>
          <Link to="/admin/usuarios/nuevo" className="admin-btn">
            + Nuevo usuario
          </Link>
        </div>

        {cargando ? (
          <div className="loading">Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div className="admin-empty">
            <h3>Sin usuarios que mostrar</h3>
            <p>No hay cuentas que coincidan con el filtro seleccionado.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Pedidos</th>
                  <th>Registrado</th>
                  <th>Estado</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr
                    key={u.id_usuario}
                    style={{ opacity: u.esta_activo == 1 ? 1 : 0.6 }}
                  >
                    <td style={{ fontWeight: 600 }}>
                      {u.nombre} {u.apellido}
                    </td>
                    <td>{u.correo}</td>
                    <td>{u.telefono || '—'}</td>
                    <td>
                      <span className="admin-badge">{u.rol}</span>
                    </td>
                    <td>{Number(u.cantidad_pedidos ?? 0)}</td>
                    <td>{formatoFechaHora(u.creado_en)}</td>
                    <td>
                      <span
                        className={`admin-badge ${u.esta_activo == 1 ? 'admin-badge-primary' : ''}`}
                      >
                        {u.esta_activo == 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="col-acciones">
                      <Link
                        to={`/admin/usuarios/${u.id_usuario}/editar`}
                        className="admin-btn admin-btn-ghost"
                      >
                        Editar
                      </Link>{' '}
                      <button
                        type="button"
                        className={`admin-btn ${u.esta_activo == 1 ? 'admin-btn-danger' : 'admin-btn-secondary'}`}
                        onClick={() => toggle.pedirConfirmacion(u)}
                      >
                        {u.esta_activo == 1 ? 'Desactivar' : 'Activar'}
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
        titulo={toggle.vaADesactivar ? 'Desactivar usuario' : 'Activar usuario'}
        mensaje={
          toggle.vaADesactivar
            ? `¿Desactivar la cuenta de ${toggle.objetivo?.nombre} ${toggle.objetivo?.apellido}? No podrá iniciar sesión, pero su historial se conserva.`
            : `¿Activar la cuenta de ${toggle.objetivo?.nombre} ${toggle.objetivo?.apellido}? Volverá a poder iniciar sesión.`
        }
        textoConfirmar={toggle.vaADesactivar ? 'Desactivar' : 'Activar'}
        colorConfirmar={toggle.vaADesactivar ? 'error' : 'primary'}
        onConfirmar={toggle.confirmar}
        onCancelar={toggle.cancelar}
      />
    </div>
  );
}

export default UsuarioMantenimiento;
