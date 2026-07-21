import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productoService, resolveImageUrl } from '../../services/api';
import { formatoMoneda, extraerErrorAPI } from '../../utils/format';
import { useToggleActivo } from '../../hooks/useToggleActivo';
import ConfirmDialog from '../../components/ConfirmDialog';
import './admin-common.css';

function ProductoMantenimiento() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    productoService
      .getAllMantenimiento()
      .then((res) => setProductos(Array.isArray(res.data) ? res.data : []))
      .catch((err) =>
        toast.error(
          extraerErrorAPI(err, 'No se pudieron cargar los productos'),
        ),
      )
      .finally(() => setCargando(false));
  }, []);

  const toggle = useToggleActivo({
    service: productoService,
    idKey: 'id_producto',
    nombreEntidad: 'Producto',
    onEstadoCambiado: (id, estado) =>
      setProductos((prev) =>
        prev.map((p) =>
          p.id_producto === id ? { ...p, esta_activo: estado } : p,
        ),
      ),
  });

  if (cargando) return <div className="loading">Cargando productos...</div>;

  return (
    <div className="admin-productos">
      <div className="page-header">
        <Link to="/admin" className="admin-form-back">
          &larr; Volver al panel
        </Link>
        <h1>Mantenimiento de Productos</h1>
        <p>Administrá el catálogo completo de productos</p>
      </div>

      <div className="page-content">
        <div className="admin-toolbar">
          <p className="admin-toolbar-titulo">
            {productos.length} productos registrados
          </p>
          <Link to="/admin/productos/nuevo" className="admin-btn">
            + Nuevo producto
          </Link>
        </div>

        {productos.length === 0 ? (
          <div className="admin-empty">
            <h3>Sin productos aún</h3>
            <p>Comenzá creando el primer producto del catálogo.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="col-imagen">Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Ingredientes</th>
                  <th>Tiempo</th>
                  <th>Estado</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr
                    key={p.id_producto}
                    style={{ opacity: p.esta_activo == 1 ? 1 : 0.6 }}
                  >
                    <td className="col-imagen">
                      {p.imagen ? (
                        <img src={resolveImageUrl(p.imagen)} alt={p.nombre} />
                      ) : (
                        <div className="col-imagen-placeholder">🌽</div>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/productos/${p.id_producto}`}
                        style={{ fontWeight: 600 }}
                      >
                        {p.nombre}
                      </Link>
                    </td>
                    <td>
                      <span className="admin-badge">{p.categoria}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {formatoMoneda(p.precio_base)}
                    </td>
                    <td>{p.cantidad_ingredientes} ingredientes</td>
                    <td>{p.tiempo_preparacion} min</td>
                    <td>
                      <span
                        className={`admin-badge ${p.esta_activo == 1 ? 'admin-badge-primary' : ''}`}
                      >
                        {p.esta_activo == 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="col-acciones">
                      <Link
                        to={`/admin/productos/${p.id_producto}/editar`}
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
        titulo={
          toggle.vaADesactivar ? 'Desactivar producto' : 'Activar producto'
        }
        mensaje={
          toggle.vaADesactivar
            ? `¿Desactivar el producto "${toggle.objetivo?.nombre}"? Dejará de mostrarse a los clientes, pero podés reactivarlo luego.`
            : `¿Activar el producto "${toggle.objetivo?.nombre}"? Volverá a estar disponible para los clientes.`
        }
        textoConfirmar={toggle.vaADesactivar ? 'Desactivar' : 'Activar'}
        colorConfirmar={toggle.vaADesactivar ? 'error' : 'primary'}
        onConfirmar={toggle.confirmar}
        onCancelar={toggle.cancelar}
      />
    </div>
  );
}

export default ProductoMantenimiento;
