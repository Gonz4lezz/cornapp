import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, TextField } from '@mui/material';
import { pedidoService, tipoCambioService } from '../services/api';
import {
  formatoMoneda,
  formatoFechaHora,
  extraerErrorAPI,
} from '../utils/format';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import MapaSeguimiento from '../components/MapaSeguimiento';
import './PedidosPage.css';
import './PedidoDetallePage.css';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const claseEstado = (nombre) =>
  `pedido-estado pedido-estado-${String(nombre)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')}`;

function PedidoDetallePage() {
  const { id } = useParams();
  const { esRol } = useAuth();
  const esPersonal = esRol('Encargado', 'Administrador');

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tipoCambio, setTipoCambio] = useState(null);
  // 'aceptar' | 'despachar' | 'entregar'
  const [confirmacion, setConfirmacion] = useState(null);
  const [restaurante, setRestaurante] = useState(null);
  const [repartidor, setRepartidor] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await pedidoService.getById(id);
      setPedido(data);
      setError(null);
    } catch (err) {
      setError(extraerErrorAPI(err, 'No se pudo cargar el pedido'));
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
    tipoCambioService
      .get()
      .then(({ data }) => setTipoCambio(data))
      .catch(() => setTipoCambio(null));
    pedidoService
      .getCatalogos()
      .then(({ data }) => setRestaurante(data.restaurante ?? null))
      .catch(() => setRestaurante(null));
  }, [cargar]);

  const ejecutarAccion = async () => {
    setProcesando(true);
    try {
      const acciones = {
        aceptar: () => pedidoService.aceptar(pedido.id_pedido),
        despachar: () => pedidoService.despachar(pedido.id_pedido, repartidor),
        entregar: () => pedidoService.entregar(pedido.id_pedido),
      };
      const mensajes = {
        aceptar: 'Pedido aceptado y enviado a cocina',
        despachar: 'Pedido despachado, ya se puede seguir en el mapa',
        entregar: 'Pedido marcado como entregado',
      };
      const { data } = await acciones[confirmacion]();
      setPedido(data);
      setRepartidor('');
      toast.success(mensajes[confirmacion]);
    } catch (err) {
      toast.error(extraerErrorAPI(err, 'No se pudo actualizar el pedido'));
    } finally {
      setProcesando(false);
      setConfirmacion(null);
    }
  };

  if (cargando) return <div className="loading">Cargando pedido...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!pedido) return <div className="error-message">Pedido no encontrado</div>;

  const totalUSD =
    tipoCambio?.colones_por_dolar > 0
      ? Number(pedido.monto_total) / Number(tipoCambio.colones_por_dolar)
      : null;
  const estadoActual = Number(pedido.id_estado);
  const ESTADO_REGISTRADO = 1;
  const ESTADO_LISTO = 4;
  const ESTADO_EN_CAMINO = 5;
  const ESTADO_ENTREGADO = 6;

  const esDomicilio = pedido.tipo_entrega === 'domicilio';
  // El mapa solo tiene sentido si el envío guardó las coordenadas del destino
  const destino =
    esDomicilio && pedido.envio?.latitud && pedido.envio?.longitud
      ? {
          latitud: Number(pedido.envio.latitud),
          longitud: Number(pedido.envio.longitud),
        }
      : null;

  // Estados en los que el encargado todavía tiene algo que hacer
  const hayAcciones =
    estadoActual === ESTADO_REGISTRADO ||
    estadoActual === ESTADO_EN_CAMINO ||
    estadoActual === ESTADO_LISTO;

  return (
    <div className="pedido-detalle-page">
      <div className="page-header">
        <Link to="/pedidos" className="detalle-volver">
          &larr; Volver a pedidos
        </Link>
        <h1>Pedido {pedido.numero_pedido}</h1>
        <p>{formatoFechaHora(pedido.creado_en)}</p>
      </div>

      <div className="page-content pedido-detalle-layout">
        <div className="pedido-factura">
          {/* ---------- Encabezado ---------- */}
          <div className="pedido-factura-cabecera">
            <div>
              <span className="pedido-factura-marca">CornApp</span>
              <span className="pedido-factura-numero">
                Factura · {pedido.numero_pedido}
              </span>
            </div>
            <span className={claseEstado(pedido.nombre_estado)}>
              {pedido.nombre_estado}
            </span>
          </div>

          <div className="pedido-factura-datos">
            <div className="factura-campo">
              <span className="factura-etiqueta">Fecha</span>
              <span className="factura-valor">
                {formatoFechaHora(pedido.creado_en)}
              </span>
            </div>
            <div className="factura-campo">
              <span className="factura-etiqueta">Cliente</span>
              <span className="factura-valor">
                {pedido.nombre_cliente} {pedido.apellido_cliente}
              </span>
              <span className="factura-subvalor">{pedido.correo_cliente}</span>
            </div>
            <div className="factura-campo">
              <span className="factura-etiqueta">Encargado</span>
              <span className="factura-valor">
                {pedido.nombre_encargado
                  ? `${pedido.nombre_encargado} ${pedido.apellido_encargado}`
                  : 'Pedido en línea'}
              </span>
            </div>
            <div className="factura-campo">
              <span className="factura-etiqueta">Método de entrega</span>
              <span className="factura-valor">
                {pedido.tipo_entrega === 'domicilio'
                  ? 'Entrega a domicilio'
                  : 'Retiro en tienda'}
              </span>
              {pedido.envio && (
                <span className="factura-subvalor">
                  <LocationOnIcon fontSize="small" />{' '}
                  {pedido.envio.direccion_texto}
                </span>
              )}
            </div>
            <div className="factura-campo">
              <span className="factura-etiqueta">Método de pago</span>
              <span className="factura-valor">{pedido.metodo_pago ?? '—'}</span>
              {pedido.ultimos_cuatro && (
                <span className="factura-subvalor">
                  Tarjeta terminada en {pedido.ultimos_cuatro}
                </span>
              )}
              {pedido.efectivo_recibido != null && (
                <span className="factura-subvalor">
                  Pagó con {formatoMoneda(pedido.efectivo_recibido)} · vuelto{' '}
                  {formatoMoneda(pedido.vuelto)}
                </span>
              )}
            </div>
          </div>

          {/* ---------- Detalle ---------- */}
          <div className="factura-detalle">
            <table className="factura-tabla">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th>Descuento</th>
                  <th>IVA (13%)</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {pedido.detalles.map((detalle) => (
                  <tr key={detalle.id_detalle}>
                    <td>
                      <span className="factura-articulo-nombre">
                        {detalle.nombre}
                      </span>
                      <span
                        className={`factura-articulo-tipo tipo-${detalle.tipo}`}
                      >
                        {detalle.tipo === 'combo' ? 'Combo' : 'Producto'}
                      </span>
                    </td>
                    <td>{formatoMoneda(detalle.precio_unitario)}</td>
                    <td>{detalle.cantidad}</td>
                    <td>{formatoMoneda(detalle.precio_total)}</td>
                    <td className="factura-descuento">
                      {Number(detalle.monto_descuento) > 0
                        ? `−${formatoMoneda(detalle.monto_descuento)}`
                        : '—'}
                    </td>
                    <td>{formatoMoneda(detalle.monto_impuesto)}</td>
                    <td className="pedido-observaciones">
                      {detalle.observaciones || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pedido.cupones.length > 0 && (
            <div className="pedido-cupones">
              <span className="factura-etiqueta">Cupones aplicados</span>
              <div className="factura-cupones-lista">
                {pedido.cupones.map((cupon) => (
                  <span key={cupon.id_cupon} className="factura-cupon-chip">
                    🎟️ {cupon.codigo} <small>({cupon.nombre})</small>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ---------- Totales ---------- */}
          <div className="pedido-totales">
            <div className="resumen-fila">
              <span>Subtotal</span>
              <span>{formatoMoneda(pedido.subtotal)}</span>
            </div>
            {Number(pedido.monto_descuento) > 0 && (
              <div className="resumen-fila resumen-descuento">
                <span>Descuento</span>
                <span>−{formatoMoneda(pedido.monto_descuento)}</span>
              </div>
            )}
            <div className="resumen-fila">
              <span>IVA (13%)</span>
              <span>{formatoMoneda(pedido.monto_impuesto)}</span>
            </div>
            {Number(pedido.costo_envio) > 0 && (
              <div className="resumen-fila">
                <span>Envío</span>
                <span>{formatoMoneda(pedido.costo_envio)}</span>
              </div>
            )}
            <div className="resumen-fila resumen-total">
              <span>Total</span>
              <span>{formatoMoneda(pedido.monto_total)}</span>
            </div>
            {totalUSD != null && (
              <div className="resumen-usd">
                ≈{' '}
                {new Intl.NumberFormat('es-CR', {
                  style: 'currency',
                  currency: 'USD',
                }).format(totalUSD)}
              </div>
            )}
          </div>

          {/* ---------- Acciones del encargado ---------- */}
          {esPersonal && hayAcciones && (
            <div className="pedido-acciones">
              {estadoActual === ESTADO_REGISTRADO && (
                <Button
                  variant="contained"
                  className="pedido-accion-aceptar"
                  onClick={() => setConfirmacion('aceptar')}
                >
                  Aceptar pedido y enviar a cocina
                </Button>
              )}

              {/* Un pedido a domicilio primero sale del local */}
              {estadoActual === ESTADO_LISTO && esDomicilio && (
                <>
                  <TextField
                    size="small"
                    label="Repartidor asignado"
                    value={repartidor}
                    onChange={(e) => setRepartidor(e.target.value)}
                    className="pedido-accion-repartidor"
                  />
                  <Button
                    variant="contained"
                    className="pedido-accion-aceptar"
                    disabled={repartidor.trim().length < 3}
                    onClick={() => setConfirmacion('despachar')}
                  >
                    Despachar pedido
                  </Button>
                </>
              )}

              {(estadoActual === ESTADO_EN_CAMINO ||
                (estadoActual === ESTADO_LISTO && !esDomicilio)) && (
                <Button
                  variant="contained"
                  className="pedido-accion-entregar"
                  onClick={() => setConfirmacion('entregar')}
                >
                  Marcar como entregado
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ---------- Seguimiento del envío en el mapa ---------- */}
        {destino && restaurante && (
          <section className="pedido-mapa">
            <h3>Seguimiento del envío</h3>
            <MapaSeguimiento
              restaurante={restaurante}
              destino={destino}
              envio={pedido.envio}
              entregado={estadoActual === ESTADO_ENTREGADO}
            />
          </section>
        )}

        {/* ---------- Seguimiento ---------- */}
        <aside className="pedido-seguimiento">
          <h3>Seguimiento del pedido</h3>
          <ul>
            {pedido.seguimiento.map((paso, indice) => (
              <li
                key={`${paso.id_estado}-${indice}`}
                className={
                  indice === pedido.seguimiento.length - 1 ? 'actual' : ''
                }
              >
                <span className="seguimiento-punto"></span>
                <div>
                  <strong>{paso.nombre_estado}</strong>
                  <span className="seguimiento-fecha">
                    {formatoFechaHora(paso.cambiado_en)}
                  </span>
                  {paso.comentario && <p>{paso.comentario}</p>}
                  {paso.nombre_usuario && (
                    <small>
                      por {paso.nombre_usuario} {paso.apellido_usuario}
                    </small>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmacion !== null}
        titulo={
          confirmacion === 'aceptar'
            ? '¿Desea aceptar este pedido?'
            : confirmacion === 'despachar'
              ? '¿Desea despachar el pedido?'
              : '¿Desea marcar como entregado?'
        }
        mensaje={
          confirmacion === 'aceptar'
            ? `El pedido ${pedido.numero_pedido} se enviará a cocina y su preparación quedará en manos del equipo.`
            : confirmacion === 'despachar'
              ? `El pedido ${pedido.numero_pedido} saldrá del local con ${repartidor} y el cliente podrá seguirlo en el mapa.`
              : `Se confirmará que el cliente recibió el pedido ${pedido.numero_pedido}.`
        }
        textoConfirmar={procesando ? 'Procesando…' : 'Confirmar'}
        onConfirmar={ejecutarAccion}
        onCancelar={() => setConfirmacion(null)}
      />
    </div>
  );
}

export default PedidoDetallePage;
