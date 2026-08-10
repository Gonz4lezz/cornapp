import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  TextField,
  MenuItem,
  Autocomplete,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
} from '@mui/material';
import {
  authService,
  pedidoService,
  tipoCambioService,
  resolveImageUrl,
} from '../services/api';
import { formatoMoneda, extraerErrorAPI } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import './CarritoPage.css';
import DeleteIcon from '@mui/icons-material/Delete';
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits';

const TASA_IMPUESTO = 0.13;

// Los selects vacíos llegan como '' y deben tratarse como "sin valor"
const numeroOpcional = () =>
  yup
    .number()
    .transform((valor, original) => (original === '' ? null : valor))
    .nullable();

// Verificación estándar de números de tarjeta (algoritmo de Luhn)
const luhnValido = (valor) => {
  const numero = String(valor || '').replace(/\D/g, '');
  if (numero.length < 13 || numero.length > 19) return false;
  let suma = 0;
  let alternar = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let digito = Number(numero[i]);
    if (alternar) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    suma += digito;
    alternar = !alternar;
  }
  return suma % 10 === 0;
};

const vencimientoVigente = (valor) => {
  const m = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.exec(String(valor || '').trim());
  if (!m) return false;
  const mes = Number(m[1]);
  let anio = Number(m[2]);
  if (anio < 100) anio += 2000;
  const finDeMes = new Date(anio, mes, 0, 23, 59, 59);
  return finDeMes >= new Date();
};

// Descuento de una línea según los cupones aplicados (igual que el backend)
const descuentoDeLinea = (item, cupones, precioTotal) => {
  const cupon = cupones.find((c) =>
    c.id_producto != null
      ? Number(c.id_producto) === Number(item.id_producto)
      : Number(c.id_combo) === Number(item.id_combo),
  );
  if (!cupon) return 0;
  if (cupon.tipo_descuento === 'porcentaje') {
    return (
      Math.round(precioTotal * (Number(cupon.valor_descuento) / 100) * 100) /
      100
    );
  }
  return Math.min(Number(cupon.valor_descuento), precioTotal);
};

function CarritoPage() {
  const navigate = useNavigate();
  const { usuario, esRol } = useAuth();
  const {
    items,
    cupones,
    cargando,
    actualizarCantidad,
    actualizarObservaciones,
    eliminar,
    aplicarCupon,
    quitarCupon,
    limpiarLocal,
  } = useCarrito();

  const esPersonal = esRol('Encargado', 'Administrador');

  const [catalogos, setCatalogos] = useState({
    metodosPago: [],
    tarifasEnvio: [],
  });
  const [clientes, setClientes] = useState([]);
  const [tipoCambio, setTipoCambio] = useState(null);
  const [codigoCupon, setCodigoCupon] = useState('');
  const [aplicandoCupon, setAplicandoCupon] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  // Ediciones locales de cantidad/observaciones (se confirman al validar)
  const [cantidades, setCantidades] = useState({});
  const [observaciones, setObservaciones] = useState({});

  // Catálogos, clientes (solo personal) y tipo de cambio (web service)
  useEffect(() => {
    pedidoService
      .getCatalogos()
      .then(({ data }) =>
        setCatalogos({
          metodosPago: data.metodosPago ?? [],
          tarifasEnvio: data.tarifasEnvio ?? [],
        }),
      )
      .catch(() =>
        toast.error('No se pudieron cargar los catálogos del pedido'),
      );
    tipoCambioService
      .get()
      .then(({ data }) => setTipoCambio(data))
      .catch(() => setTipoCambio(null));
  }, []);

  useEffect(() => {
    if (!esPersonal) return;
    authService
      .clientes()
      .then(({ data }) => setClientes(data ?? []))
      .catch(() => toast.error('No se pudo cargar la lista de clientes'));
  }, [esPersonal]);

  // ----- Cálculos de la factura (asincrónicos, sin recargar) -----
  const lineas = useMemo(
    () =>
      items.map((item) => {
        const precioUnitario = Number(item.precio_unitario);
        const cantidad = Number(item.cantidad);
        const precioTotal = Math.round(precioUnitario * cantidad * 100) / 100;
        const descuento = descuentoDeLinea(item, cupones, precioTotal);
        const impuesto =
          Math.round((precioTotal - descuento) * TASA_IMPUESTO * 100) / 100;
        return {
          item,
          precioUnitario,
          cantidad,
          precioTotal,
          descuento,
          impuesto,
        };
      }),
    [items, cupones],
  );

  const totales = useMemo(() => {
    const subtotal = lineas.reduce((s, l) => s + l.precioTotal, 0);
    const descuento = lineas.reduce((s, l) => s + l.descuento, 0);
    const impuesto = lineas.reduce((s, l) => s + l.impuesto, 0);
    return { subtotal, descuento, impuesto };
  }, [lineas]);

  // ----- Formulario del encabezado y el pago -----
  const schema = useMemo(
    () =>
      yup.object({
        id_cliente: esPersonal
          ? numeroOpcional().required('Seleccione el cliente del pedido')
          : numeroOpcional(),
        tipo_entrega: yup
          .string()
          .oneOf(['recogida', 'domicilio'])
          .required('Seleccione el método de entrega'),
        id_tarifa: numeroOpcional().when('tipo_entrega', {
          is: 'domicilio',
          then: (s) => s.required('Seleccione la zona de envío'),
        }),
        direccion: yup.string().when('tipo_entrega', {
          is: 'domicilio',
          then: (s) =>
            s
              .required('Indique la dirección de entrega')
              .min(10, 'La dirección debe tener al menos 10 caracteres'),
          otherwise: (s) => s.optional(),
        }),
        referencia: yup.string().optional(),
        id_metodo: numeroOpcional().required('Seleccione el método de pago'),
        titular: yup.string().when('$esTarjeta', {
          is: true,
          then: (s) =>
            s
              .required('Indique el nombre del titular')
              .min(5, 'Indique el nombre como aparece en la tarjeta'),
          otherwise: (s) => s.optional(),
        }),
        numero: yup.string().when('$esTarjeta', {
          is: true,
          then: (s) =>
            s
              .required('Indique el número de la tarjeta')
              .test('luhn', 'El número de tarjeta no es válido', (v) =>
                luhnValido(v),
              ),
          otherwise: (s) => s.optional(),
        }),
        vencimiento: yup.string().when('$esTarjeta', {
          is: true,
          then: (s) =>
            s
              .required('Indique el vencimiento (MM/AA)')
              .test(
                'vigencia',
                'El vencimiento no es válido o ya expiró',
                (v) => vencimientoVigente(v),
              ),
          otherwise: (s) => s.optional(),
        }),
        cvv: yup.string().when('$esTarjeta', {
          is: true,
          then: (s) =>
            s
              .required('Indique el CVV')
              .matches(/^\d{3,4}$/, 'El CVV debe tener 3 o 4 dígitos'),
          otherwise: (s) => s.optional(),
        }),
        efectivo_recibido: numeroOpcional().when('$esEfectivo', {
          is: true,
          then: (s) =>
            s
              .typeError('El monto debe ser numérico')
              .required('Indique el monto con el que paga')
              .positive('El monto debe ser mayor a cero'),
        }),
      }),
    [esPersonal],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: (values, context, options) =>
      yupResolver(schema)(
        values,
        {
          esTarjeta: esTarjetaSeleccionada(values.id_metodo),
          esEfectivo: esEfectivoSeleccionado(values.id_metodo),
        },
        options,
      ),
    defaultValues: {
      id_cliente: null,
      tipo_entrega: 'recogida',
      id_tarifa: null,
      direccion: '',
      referencia: '',
      id_metodo: '',
      titular: '',
      numero: '',
      vencimiento: '',
      cvv: '',
      efectivo_recibido: '',
    },
  });

  const tipoEntrega = watch('tipo_entrega');
  const idTarifa = watch('id_tarifa');
  const idMetodo = watch('id_metodo');
  const idClienteSeleccionado = watch('id_cliente');
  const efectivoRecibido = watch('efectivo_recibido');

  const metodoSeleccionado = catalogos.metodosPago.find(
    (m) => Number(m.id_metodo) === Number(idMetodo),
  );
  function esTarjetaSeleccionada(id) {
    const metodo = catalogos.metodosPago.find(
      (m) => Number(m.id_metodo) === Number(id),
    );
    return Boolean(metodo && /tarjeta/i.test(metodo.nombre));
  }
  function esEfectivoSeleccionado(id) {
    const metodo = catalogos.metodosPago.find(
      (m) => Number(m.id_metodo) === Number(id),
    );
    return Boolean(metodo && /efectivo/i.test(metodo.nombre));
  }
  const esTarjeta = Boolean(
    metodoSeleccionado && /tarjeta/i.test(metodoSeleccionado.nombre),
  );
  const esEfectivo = Boolean(
    metodoSeleccionado && /efectivo/i.test(metodoSeleccionado.nombre),
  );

  const tarifaSeleccionada = catalogos.tarifasEnvio.find(
    (t) => Number(t.id_tarifa) === Number(idTarifa),
  );
  const costoEnvio =
    tipoEntrega === 'domicilio' && tarifaSeleccionada
      ? Number(tarifaSeleccionada.tarifa_base)
      : 0;

  const total =
    Math.round(
      (totales.subtotal - totales.descuento + totales.impuesto + costoEnvio) *
        100,
    ) / 100;
  const totalUSD =
    tipoCambio?.colones_por_dolar > 0
      ? total / Number(tipoCambio.colones_por_dolar)
      : null;
  const vuelto =
    esEfectivo && Number(efectivoRecibido) >= total
      ? Math.round((Number(efectivoRecibido) - total) * 100) / 100
      : null;

  const clienteSeleccionado = clientes.find(
    (c) => Number(c.id_usuario) === Number(idClienteSeleccionado),
  );

  const fechaActual = new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // ----- Acciones sobre las líneas -----
  const cambiarCantidad = async (linea, valor) => {
    // Solo se aceptan números (con notificación, según el enunciado)
    if (valor !== '' && !/^\d+$/.test(valor)) {
      toast.error('La cantidad solo acepta números');
      return;
    }
    setCantidades((prev) => ({ ...prev, [linea.item.id_carrito]: valor }));
    // La caja vacía NO borra la línea: se espera a que escriban un número
    if (valor === '') return;

    const cantidad = Number(valor);
    if (cantidad === Number(linea.item.cantidad)) return;
    const ok = await actualizarCantidad(linea.item.id_carrito, cantidad);
    if (ok) {
      if (cantidad === 0) toast.success('Línea eliminada del pedido');
      setCantidades((prev) => {
        const copia = { ...prev };
        delete copia[linea.item.id_carrito];
        return copia;
      });
    }
  };

  const restaurarCantidad = (linea) => {
    // Al salir de la caja vacía se restaura la cantidad real
    setCantidades((prev) => {
      const copia = { ...prev };
      delete copia[linea.item.id_carrito];
      return copia;
    });
  };

  const guardarObservaciones = async (linea) => {
    const valor = observaciones[linea.item.id_carrito];
    if (valor === undefined || valor === (linea.item.observaciones ?? '')) {
      return;
    }
    const ok = await actualizarObservaciones(linea.item.id_carrito, valor);
    if (ok) toast.success('Observación guardada');
  };

  const alAplicarCupon = async () => {
    if (!codigoCupon.trim()) {
      toast.error('Ingrese el código del cupón');
      return;
    }
    setAplicandoCupon(true);
    const ok = await aplicarCupon(codigoCupon.trim().toUpperCase());
    if (ok) setCodigoCupon('');
    setAplicandoCupon(false);
  };

  // ----- Registro del pedido -----
  const onSubmit = async (valores) => {
    setRegistrando(true);
    try {
      const payload = {
        tipo_entrega: valores.tipo_entrega,
        id_metodo: Number(valores.id_metodo),
      };
      if (esPersonal) payload.id_cliente = Number(valores.id_cliente);
      if (valores.tipo_entrega === 'domicilio') {
        payload.id_tarifa = Number(valores.id_tarifa);
        payload.direccion = valores.direccion;
        payload.referencia = valores.referencia;
      }
      if (esTarjeta) {
        payload.tarjeta = {
          titular: valores.titular,
          numero: valores.numero,
          vencimiento: valores.vencimiento,
          cvv: valores.cvv,
        };
      }
      if (esEfectivo) {
        payload.efectivo_recibido = Number(valores.efectivo_recibido);
      }

      const { data } = await pedidoService.crear(payload);
      limpiarLocal();
      toast.success(
        data.vuelto != null
          ? `¡Pedido registrado! Vuelto: ${formatoMoneda(data.vuelto)}`
          : '¡Pedido registrado correctamente!',
      );
      navigate(`/pedidos/${data.id_pedido}`);
    } catch (error) {
      toast.error(extraerErrorAPI(error, 'No se pudo registrar el pedido'));
    } finally {
      setRegistrando(false);
    }
  };

  if (cargando) {
    return <div className="loading">Cargando carrito...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="carrito-page">
        <div className="page-header">
          <h1>Tu carrito</h1>
        </div>
        <div className="carrito-vacio">
          <span className="carrito-vacio-icono" >
            <ProductionQuantityLimitsIcon fontSize="large"/>
          </span>
          <h2>El carrito está vacío</h2>
          <p>Agrega productos o combos del menú para armar tu pedido.</p>
          <Link to="/productos" className="carrito-vacio-boton">
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="carrito-page">
      <div className="page-header">
        <h1>Registrar pedido</h1>
        <p>Revisa tu pedido, aplica cupones y completa el pago</p>
      </div>

      <form
        className="page-content carrito-layout"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="carrito-factura">
          {/* ---------- Encabezado tipo factura ---------- */}
          <section className="factura-encabezado">
            <h2 className="factura-titulo">CornApp — Pedido</h2>
            <div className="factura-encabezado-grid">
              <div className="factura-campo">
                <span className="factura-etiqueta">Fecha</span>
                <span className="factura-valor">{fechaActual}</span>
              </div>

              <div className="factura-campo">
                <span className="factura-etiqueta">Estado</span>
                <span className="factura-estado">Pendiente de confirmar</span>
              </div>

              {!esPersonal ? (
                <div className="factura-campo">
                  <span className="factura-etiqueta">Cliente</span>
                  <span className="factura-valor">
                    {usuario.nombre} {usuario.apellido}
                  </span>
                  <span className="factura-subvalor">{usuario.correo}</span>
                </div>
              ) : (
                <>
                  <div className="factura-campo factura-campo-cliente">
                    <span className="factura-etiqueta">Cliente</span>
                    <Controller
                      name="id_cliente"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          size="small"
                          options={clientes}
                          getOptionLabel={(c) =>
                            `${c.nombre} ${c.apellido}`.trim()
                          }
                          value={
                            clientes.find(
                              (c) =>
                                Number(c.id_usuario) === Number(field.value),
                            ) ?? null
                          }
                          onChange={(_, nuevo) =>
                            field.onChange(nuevo ? nuevo.id_usuario : null)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Buscar cliente…"
                              error={Boolean(errors.id_cliente)}
                              helperText={errors.id_cliente?.message}
                            />
                          )}
                        />
                      )}
                    />
                    {clienteSeleccionado && (
                      <div className="factura-cliente-detalle">
                        <span>{clienteSeleccionado.correo}</span>
                        {clienteSeleccionado.telefono && (
                          <span>{clienteSeleccionado.telefono}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="factura-campo">
                    <span className="factura-etiqueta">Encargado</span>
                    <span className="factura-valor">
                      {usuario.nombre} {usuario.apellido}
                    </span>
                    <span className="factura-subvalor">
                      Sesión actual
                    </span>
                  </div>
                </>
              )}

              <div className="factura-campo factura-campo-entrega">
                <span className="factura-etiqueta">Método de entrega</span>
                <Controller
                  name="tipo_entrega"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup row {...field}>
                      <FormControlLabel
                        value="recogida"
                        control={<Radio size="small" />}
                        label="Retiro en tienda"
                      />
                      <FormControlLabel
                        value="domicilio"
                        control={<Radio size="small" />}
                        label="Entrega a domicilio"
                      />
                    </RadioGroup>
                  )}
                />
              </div>
            </div>

            {tipoEntrega === 'domicilio' && (
              <div className="factura-domicilio">
                <Controller
                  name="id_tarifa"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      size="small"
                      label="Zona de envío"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={Boolean(errors.id_tarifa)}
                      helperText={errors.id_tarifa?.message}
                      className="factura-domicilio-zona"
                    >
                      {catalogos.tarifasEnvio.map((t) => (
                        <MenuItem key={t.id_tarifa} value={t.id_tarifa}>
                          {t.nombre} — {formatoMoneda(t.tarifa_base)}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <TextField
                  size="small"
                  label="Dirección de entrega"
                  fullWidth
                  error={Boolean(errors.direccion)}
                  helperText={errors.direccion?.message}
                  {...register('direccion')}
                />
                <TextField
                  size="small"
                  label="Referencia (opcional)"
                  fullWidth
                  {...register('referencia')}
                />
              </div>
            )}
          </section>

          {/* ---------- Detalle ---------- */}
          <section className="factura-detalle">
            <table className="factura-tabla">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th>Descuento</th>
                  <th>IVA (13%)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea) => (
                  <tr key={linea.item.id_carrito}>
                    <td className="factura-articulo">
                      <div className="factura-articulo-info">
                        {linea.item.imagen ? (
                          <img
                            src={resolveImageUrl(linea.item.imagen)}
                            alt={linea.item.nombre}
                          />
                        ) : (
                          <span className="factura-articulo-placeholder">
                            
                          </span>
                        )}
                        <div>
                          <span className="factura-articulo-nombre">
                            {linea.item.nombre}
                          </span>
                          <span
                            className={`factura-articulo-tipo tipo-${linea.item.tipo}`}
                          >
                            {linea.item.tipo === 'combo' ? 'Combo' : 'Producto'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="text"
                        className="factura-observaciones"
                        placeholder="Observaciones de preparación…"
                        value={
                          observaciones[linea.item.id_carrito] ??
                          linea.item.observaciones ??
                          ''
                        }
                        onChange={(e) =>
                          setObservaciones((prev) => ({
                            ...prev,
                            [linea.item.id_carrito]: e.target.value,
                          }))
                        }
                        onBlur={() => guardarObservaciones(linea)}
                      />
                    </td>
                    <td>{formatoMoneda(linea.precioUnitario)}</td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="factura-cantidad"
                        value={
                          cantidades[linea.item.id_carrito] ??
                          String(linea.item.cantidad)
                        }
                        onChange={(e) => cambiarCantidad(linea, e.target.value)}
                        onBlur={() => restaurarCantidad(linea)}
                        aria-label={`Cantidad de ${linea.item.nombre}`}
                      />
                    </td>
                    <td>{formatoMoneda(linea.precioTotal)}</td>
                    <td className="factura-descuento">
                      {linea.descuento > 0
                        ? `−${formatoMoneda(linea.descuento)}`
                        : '—'}
                    </td>
                    <td>{formatoMoneda(linea.impuesto)}</td>
                    <td>
                      <button
                        type="button"
                        className="factura-borrar"
                        title="Eliminar línea"
                        onClick={() => eliminar(linea.item.id_carrito)}
                      >
                        <DeleteIcon fontSize="medium" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ---------- Cupones ---------- */}
          <section className="factura-cupones">
            <label htmlFor="cupon-input" className="factura-etiqueta">
              Cupón de descuento
            </label>
            <div className="factura-cupon-input">
              <input
                id="cupon-input"
                type="text"
                placeholder="Ej: CLASICO15"
                value={codigoCupon}
                onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    alAplicarCupon();
                  }
                }}
              />
              <button
                type="button"
                onClick={alAplicarCupon}
                disabled={aplicandoCupon}
              >
                {aplicandoCupon ? 'Aplicando…' : 'Aplicar'}
              </button>
            </div>
            {cupones.length > 0 && (
              <div className="factura-cupones-lista">
                {cupones.map((cupon) => (
                  <span key={cupon.id_cupon} className="factura-cupon-chip">
                     {cupon.codigo}
                    <small>({cupon.nombre_objetivo})</small>
                    <button
                      type="button"
                      title="Quitar cupón"
                      onClick={() => quitarCupon(cupon.id_cupon)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ---------- Totales y pago ---------- */}
        <aside className="carrito-resumen">
          <h3>Resumen del pedido</h3>
          <div className="resumen-fila">
            <span>Subtotal</span>
            <span>{formatoMoneda(totales.subtotal)}</span>
          </div>
          {totales.descuento > 0 && (
            <div className="resumen-fila resumen-descuento">
              <span>Descuento</span>
              <span>−{formatoMoneda(totales.descuento)}</span>
            </div>
          )}
          <div className="resumen-fila">
            <span>IVA (13%)</span>
            <span>{formatoMoneda(totales.impuesto)}</span>
          </div>
          {tipoEntrega === 'domicilio' && (
            <div className="resumen-fila">
              <span>Envío</span>
              <span>
                {tarifaSeleccionada
                  ? formatoMoneda(costoEnvio)
                  : 'Seleccione la zona'}
              </span>
            </div>
          )}
          <div className="resumen-fila resumen-total">
            <span>Total</span>
            <span>{formatoMoneda(total)}</span>
          </div>
          {totalUSD != null && (
            <div className="resumen-usd">
              ≈{' '}
              {new Intl.NumberFormat('es-CR', {
                style: 'currency',
                currency: 'USD',
              }).format(totalUSD)}{' '}
              <small>
                (tipo de cambio: ₡{tipoCambio.colones_por_dolar} por USD)
              </small>
            </div>
          )}

          <div className="resumen-pago">
            <h4>Método de pago</h4>
            <Controller
              name="id_metodo"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Seleccione el método"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  error={Boolean(errors.id_metodo)}
                  helperText={errors.id_metodo?.message}
                >
                  {catalogos.metodosPago.map((m) => (
                    <MenuItem key={m.id_metodo} value={m.id_metodo}>
                      {m.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {esTarjeta && (
              <div className="resumen-tarjeta">
                <TextField
                  size="small"
                  label="Titular de la tarjeta"
                  fullWidth
                  error={Boolean(errors.titular)}
                  helperText={errors.titular?.message}
                  {...register('titular')}
                />
                <TextField
                  size="small"
                  label="Número de tarjeta"
                  fullWidth
                  placeholder="4242 4242 4242 4242"
                  error={Boolean(errors.numero)}
                  helperText={errors.numero?.message}
                  {...register('numero')}
                />
                <div className="resumen-tarjeta-fila">
                  <TextField
                    size="small"
                    label="Vencimiento (MM/AA)"
                    placeholder="08/27"
                    error={Boolean(errors.vencimiento)}
                    helperText={errors.vencimiento?.message}
                    {...register('vencimiento')}
                  />
                  <TextField
                    size="small"
                    label="CVV"
                    type="password"
                    placeholder="123"
                    error={Boolean(errors.cvv)}
                    helperText={errors.cvv?.message}
                    {...register('cvv')}
                  />
                </div>
                <p className="resumen-nota">
                  Pago simulado: no se realiza ningún cobro real.
                </p>
              </div>
            )}

            {esEfectivo && (
              <div className="resumen-efectivo">
                <TextField
                  size="small"
                  label="¿Con cuánto paga?"
                  fullWidth
                  error={Boolean(errors.efectivo_recibido)}
                  helperText={errors.efectivo_recibido?.message}
                  {...register('efectivo_recibido')}
                />
                {Number(efectivoRecibido) > 0 &&
                  (Number(efectivoRecibido) >= total ? (
                    <p className="resumen-vuelto">
                      Vuelto: <strong>{formatoMoneda(vuelto)}</strong>
                    </p>
                  ) : (
                    <p className="resumen-vuelto resumen-vuelto-error">
                      El monto no alcanza para cubrir el total
                    </p>
                  ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={registrando}
            className="resumen-confirmar"
          >
            {registrando ? 'Registrando pedido…' : 'Confirmar y pagar'}
          </Button>
        </aside>
      </form>
    </div>
  );
}

export default CarritoPage;
