import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { TextField, MenuItem } from '@mui/material';
import { cocinaService, estacionService } from '../services/api';
import { formatoFechaHora, extraerErrorAPI } from '../utils/format';
import './CocinaPage.css';

const INTERVALO_POLLING = 7000; // ms: el tablero se refresca solo (tiempo real)

function CocinaPage() {
  const [items, setItems] = useState([]);
  const [estaciones, setEstaciones] = useState([]);
  const [filtroEstacion, setFiltroEstacion] = useState('');
  const [cargando, setCargando] = useState(true);
  const pedidosConocidos = useRef(null);

  const cargar = useCallback(
    async (avisarNuevos = true) => {
      try {
        const { data } = await cocinaService.getTablero(filtroEstacion || null);
        const nuevos = data.items ?? [];
        setItems(nuevos);

        // Notificar cuando entra un pedido nuevo al tablero (sin filtro activo)
        if (!filtroEstacion) {
          const ids = new Set(nuevos.map((item) => item.id_pedido));
          if (avisarNuevos && pedidosConocidos.current !== null) {
            const anteriores = pedidosConocidos.current;
            const nuevosPedidos = [...ids].filter((id) => !anteriores.has(id));
            if (nuevosPedidos.length > 0) {
              toast('¡Nuevo pedido en cocina!', { icon: '🔔' });
            }
          }
          pedidosConocidos.current = ids;
        }
      } catch (error) {
        toast.error(extraerErrorAPI(error, 'No se pudo cargar el tablero'));
      } finally {
        setCargando(false);
      }
    },
    [filtroEstacion],
  );

  useEffect(() => {
    estacionService
      .getAll()
      .then(({ data }) => setEstaciones(data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    cargar(false);
    const intervalo = setInterval(() => cargar(true), INTERVALO_POLLING);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const avanzar = async (item) => {
    try {
      const { data } = await cocinaService.avanzar(item.id_item_cocina);
      if (!filtroEstacion) {
        setItems(data.items ?? []);
      } else {
        cargar(false);
      }
      toast.success(
        item.estado === 'pendiente'
          ? `${item.producto}: preparación iniciada`
          : `${item.producto}: avanzó en el proceso`,
      );
    } catch (error) {
      toast.error(extraerErrorAPI(error, 'No se pudo actualizar el item'));
    }
  };

  // Agrupar los items por pedido para el tablero
  const pedidos = useMemo(() => {
    const mapa = new Map();
    items.forEach((item) => {
      if (!mapa.has(item.id_pedido)) {
        mapa.set(item.id_pedido, {
          id_pedido: item.id_pedido,
          numero_pedido: item.numero_pedido,
          fecha_pedido: item.fecha_pedido,
          tipo_entrega: item.tipo_entrega,
          items: [],
        });
      }
      mapa.get(item.id_pedido).items.push(item);
    });
    return [...mapa.values()];
  }, [items]);

  const etiquetaBoton = (item) => {
    if (item.estado === 'pendiente') {
      return item.id_estacion_actual ? 'Iniciar' : 'Completar';
    }
    return Number(item.paso_actual) < Number(item.total_pasos)
      ? 'Siguiente estación'
      : 'Finalizar';
  };

  return (
    <div className="cocina-page">
      <div className="page-header">
        <h1>Gestión de cocina</h1>
        <p>
          Pedidos aceptados en tiempo real, con el avance por estación de
          trabajo
        </p>
      </div>

      <div className="page-content">
        <div className="cocina-controles">
          <TextField
            size="small"
            select
            label="Estación de trabajo"
            value={filtroEstacion}
            onChange={(e) => setFiltroEstacion(e.target.value)}
            className="cocina-filtro"
          >
            <MenuItem value="">Todas las estaciones</MenuItem>
            {estaciones.map((estacion) => (
              <MenuItem key={estacion.id_estacion} value={estacion.id_estacion}>
                {estacion.nombre}
              </MenuItem>
            ))}
          </TextField>

          <div className="cocina-leyenda">
            <span className="leyenda-item leyenda-pendiente">Pendiente</span>
            <span className="leyenda-item leyenda-proceso">En proceso</span>
            <span className="leyenda-item leyenda-completado">Completado</span>
            {estaciones.map((estacion) => (
              <span
                key={estacion.id_estacion}
                className="leyenda-item"
                style={{
                  borderColor: estacion.color_estacion,
                  color: estacion.color_estacion,
                }}
              >
                {estacion.nombre}
              </span>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="loading">Cargando tablero de cocina...</div>
        ) : pedidos.length === 0 ? (
          <div className="cocina-vacio">
            <span>👨‍🍳</span>
            <h2>No hay pedidos en preparación</h2>
            <p>
              Cuando el encargado acepte un pedido aparecerá aquí
              automáticamente.
            </p>
          </div>
        ) : (
          <div className="cocina-tablero">
            {pedidos.map((pedido) => (
              <article key={pedido.id_pedido} className="cocina-pedido">
                <header className="cocina-pedido-cabecera">
                  <div>
                    <strong>{pedido.numero_pedido}</strong>
                    <span>{formatoFechaHora(pedido.fecha_pedido)}</span>
                  </div>
                  <span className="cocina-pedido-entrega">
                    {pedido.tipo_entrega === 'domicilio'
                      ? '🛵 Domicilio'
                      : '🏪 Recogida'}
                  </span>
                </header>

                <ul className="cocina-items">
                  {pedido.items.map((item) => (
                    <li
                      key={item.id_item_cocina}
                      className={`cocina-item cocina-item-${item.estado}`}
                    >
                      <div className="cocina-item-info">
                        <span className="cocina-item-cantidad">
                          ×{item.cantidad}
                        </span>
                        <div>
                          <span className="cocina-item-nombre">
                            {item.producto}
                          </span>
                          {item.nombre_combo && (
                            <span className="cocina-item-combo">
                              Del combo: {item.nombre_combo}
                            </span>
                          )}
                          {item.observaciones && (
                            <span className="cocina-item-obs">
                              📝 {item.observaciones}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="cocina-item-derecha">
                        {item.estado === 'completado' ? (
                          <span className="cocina-item-listo">✓ Listo</span>
                        ) : (
                          <>
                            {item.estacion ? (
                              <span
                                className="cocina-item-estacion"
                                style={{
                                  background: `${item.color_estacion}22`,
                                  borderColor: item.color_estacion,
                                  color: item.color_estacion,
                                }}
                              >
                                {item.estacion}
                                {item.total_pasos > 0 && (
                                  <small>
                                    paso {item.paso_actual ?? 1} de{' '}
                                    {item.total_pasos}
                                  </small>
                                )}
                              </span>
                            ) : (
                              <span className="cocina-item-estacion cocina-item-sin-proceso">
                                Sin proceso definido
                              </span>
                            )}
                            <button
                              type="button"
                              className="cocina-item-boton"
                              onClick={() => avanzar(item)}
                            >
                              {etiquetaBoton(item)}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CocinaPage;
