import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { TextField, MenuItem } from '@mui/material';
import { pedidoService } from '../services/api';
import {
  formatoMoneda,
  formatoFechaHora,
  extraerErrorAPI,
} from '../utils/format';
import { useAuth } from '../context/AuthContext';
import './PedidosPage.css';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';

const claseEstado = (nombre) =>
  `pedido-estado pedido-estado-${String(nombre)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')}`;

function PedidosPage() {
  const { esRol } = useAuth();
  const esPersonal = esRol('Encargado', 'Administrador');

  const [pedidos, setPedidos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const filtros = {};
      if (esPersonal && filtroFecha) filtros.fecha = filtroFecha;
      if (esPersonal && filtroEstado) filtros.estado = filtroEstado;
      const { data } = await pedidoService.getHistorial(filtros);
      setPedidos(data ?? []);
    } catch (error) {
      toast.error(extraerErrorAPI(error, 'No se pudieron cargar los pedidos'));
    } finally {
      setCargando(false);
    }
  }, [esPersonal, filtroFecha, filtroEstado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!esPersonal) return;
    pedidoService
      .getCatalogos()
      .then(({ data }) => setEstados(data.estados ?? []))
      .catch(() => {});
  }, [esPersonal]);

  return (
    <div className="pedidos-page">
      <div className="page-header">
        <h1>{esPersonal ? 'Pedidos' : 'Mis pedidos'}</h1>
        <p>
          {esPersonal
            ? 'Todos los pedidos registrados, ordenados por fecha'
            : 'Tu historial de pedidos, ordenado por fecha'}
        </p>
      </div>

      <div className="page-content">
        {esPersonal && (
          <div className="pedidos-filtros">
            <TextField
              size="small"
              type="date"
              label="Filtrar por fecha"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size="small"
              select
              label="Filtrar por estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="pedidos-filtro-estado"
            >
              <MenuItem value="">Todos los estados</MenuItem>
              {estados.map((estado) => (
                <MenuItem key={estado.id_estado} value={estado.id_estado}>
                  {estado.nombre_estado}
                </MenuItem>
              ))}
            </TextField>
            {(filtroFecha || filtroEstado) && (
              <button
                type="button"
                className="pedidos-limpiar"
                onClick={() => {
                  setFiltroFecha('');
                  setFiltroEstado('');
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {cargando ? (
          <div className="loading">Cargando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="pedidos-vacio">
            <CancelPresentationIcon fontSize="large" />
            <p>
              {esPersonal
                ? 'No hay pedidos que coincidan con los filtros.'
                : 'Aún no has realizado ningún pedido.'}
            </p>
          </div>
        ) : (
          <div className="pedidos-tabla-contenedor">
            <table className="pedidos-tabla">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  {esPersonal && <th>Cliente</th>}
                  <th>Artículos</th>
                  <th>Entrega</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.id_pedido}>
                    <td className="pedidos-numero">{pedido.numero_pedido}</td>
                    <td>{formatoFechaHora(pedido.creado_en)}</td>
                    {esPersonal && (
                      <td>
                        {pedido.nombre_cliente} {pedido.apellido_cliente}
                      </td>
                    )}
                    <td>{pedido.cantidad_articulos ?? 0}</td>
                    <td>
                      {pedido.tipo_entrega === 'domicilio'
                        ? 'A domicilio'
                        : 'Retiro en tienda'}
                    </td>
                    <td>{pedido.metodo_pago ?? '—'}</td>
                    <td className="pedidos-total">
                      {formatoMoneda(pedido.monto_total)}
                    </td>
                    <td>
                      <span className={claseEstado(pedido.nombre_estado)}>
                        {pedido.nombre_estado}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/pedidos/${pedido.id_pedido}`}
                        className="pedidos-ver"
                      >
                        Ver detalle →
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

export default PedidosPage;
