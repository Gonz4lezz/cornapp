import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { comboService } from '../../services/api';
import { formatoMoneda, extraerErrorAPI } from '../../utils/format';
import './admin-common.css';

function ComboMantenimiento() {
  const [combos, setCombos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    comboService
      .getAllMantenimiento()
      .then((res) => setCombos(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(extraerErrorAPI(err, 'No se pudieron cargar los combos')))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="loading">Cargando combos...</div>;

  return (
    <div className="admin-combos">
      <div className="page-header">
        <Link to="/admin" className="admin-form-back">&larr; Volver al panel</Link>
        <h1>Mantenimiento de Combos</h1>
        <p>Administrá los combos y sus productos asociados</p>
      </div>

      <div className="page-content">
        <div className="admin-toolbar">
          <p className="admin-toolbar-titulo">{combos.length} combos registrados</p>
          <Link to="/admin/combos/nuevo" className="admin-btn">+ Nuevo combo</Link>
        </div>

        {combos.length === 0 ? (
          <div className="admin-empty">
            <h3>Sin combos aún</h3>
            <p>Creá el primer combo del catálogo.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Productos</th>
                  <th>Precio</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((c) => (
                  <tr key={c.id_combo}>
                    <td>
                      <Link to={`/combos/${c.id_combo}`} style={{ fontWeight: 600 }}>
                        {c.nombre}
                      </Link>
                    </td>
                    <td style={{ maxWidth: 340, color: 'var(--text-light)' }}>
                      {c.descripcion?.length > 80 ? c.descripcion.substring(0, 80) + '…' : c.descripcion}
                    </td>
                    <td>{c.cantidad_productos} productos</td>
                    <td style={{ fontWeight: 600 }}>{formatoMoneda(c.precio_combo)}</td>
                    <td className="col-acciones">
                      <Link
                        to={`/admin/combos/${c.id_combo}/editar`}
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

export default ComboMantenimiento;
