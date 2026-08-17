import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardService } from '../services/api';
import { formatoFecha, formatoMoneda, extraerErrorAPI } from '../utils/format';
import './DashboardPage.css';

// Un color por estado, en el mismo orden del ciclo de vida del pedido
const COLORES_ESTADO = {
  Registrado: '#3B82F6',
  Aceptado: '#A855F7',
  'En preparación': '#F59E0B',
  Listo: '#10B981',
  'En camino': '#06B6D4',
  Entregado: '#64748B',
};

function DashboardPage() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    dashboardService
      .get()
      .then(({ data }) => setDatos(data))
      .catch((error) =>
        toast.error(extraerErrorAPI(error, 'No se pudo cargar el tablero')),
      )
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="loading">Cargando tablero...</div>;
  if (!datos)
    return <div className="error-message">No hay datos que mostrar</div>;

  const topProductos = (datos.topProductos ?? []).map((p) => ({
    nombre: p.nombre,
    unidades: Number(p.unidades),
  }));

  // Para el gráfico circular solo interesan los estados con pedidos hoy
  const porEstado = (datos.pedidosPorEstado ?? [])
    .map((e) => ({
      nombre: e.nombre_estado,
      cantidad: Number(e.cantidad),
    }))
    .filter((e) => e.cantidad > 0);

  const resumen = datos.resumenHoy ?? {};
  const hayPedidosHoy = porEstado.length > 0;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Tablero de control</h1>
        <p>Resumen de la operación al {formatoFecha(datos.fecha)}</p>
      </div>

      <div className="page-content">
        <div className="dashboard-tarjetas">
          <article className="dashboard-tarjeta">
            <span className="dashboard-tarjeta-titulo">Pedidos de hoy</span>
            <strong className="dashboard-tarjeta-valor">
              {Number(resumen.pedidos ?? 0)}
            </strong>
          </article>
          <article className="dashboard-tarjeta">
            <span className="dashboard-tarjeta-titulo">Ingresos de hoy</span>
            <strong className="dashboard-tarjeta-valor">
              {formatoMoneda(resumen.ingresos ?? 0)}
            </strong>
          </article>
          <article className="dashboard-tarjeta">
            <span className="dashboard-tarjeta-titulo">Cobrado por envíos</span>
            <strong className="dashboard-tarjeta-valor">
              {formatoMoneda(resumen.envios ?? 0)}
            </strong>
          </article>
        </div>

        <div className="dashboard-graficos">
          <section className="dashboard-grafico">
            <h2>Los 3 productos más pedidos</h2>
            <p className="dashboard-grafico-nota">
              Incluye las unidades vendidas dentro de los combos
            </p>
            {topProductos.length === 0 ? (
              <p className="dashboard-vacio">
                Todavía no hay ventas registradas.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={topProductos}
                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis
                    dataKey="nombre"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    height={60}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(valor) => [`${valor} unidades`, 'Vendidas']}
                  />
                  <Bar
                    dataKey="unidades"
                    name="Unidades vendidas"
                    fill="#FF8E42"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          <section className="dashboard-grafico">
            <h2>Pedidos de hoy por estado</h2>
            <p className="dashboard-grafico-nota">
              Solo los pedidos registrados en la fecha actual
            </p>
            {!hayPedidosHoy ? (
              <p className="dashboard-vacio">
                Todavía no se han registrado pedidos hoy.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={porEstado}
                    dataKey="cantidad"
                    nameKey="nombre"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    label={({ cantidad }) => cantidad}
                  >
                    {porEstado.map((estado) => (
                      <Cell
                        key={estado.nombre}
                        fill={COLORES_ESTADO[estado.nombre] || '#CBD5E1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(valor, nombre) => [`${valor} pedidos`, nombre]}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
