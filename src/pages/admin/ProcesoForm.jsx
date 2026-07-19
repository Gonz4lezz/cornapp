import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  TextField,
  MenuItem,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  procesoService,
  productoService,
  estacionService,
} from '../../services/api';
import { extraerErrorAPI } from '../../utils/format';
import './admin-common.css';

const schema = yup.object({
  id_producto: yup
    .number()
    .typeError('Seleccioná un producto')
    .required('Seleccioná un producto')
    .positive('Seleccioná un producto'),
  tiempo_estimado_total: yup
    .number()
    .typeError('Ingresá un número')
    .min(0, 'No puede ser negativo')
    .integer('Debe ser un entero')
    .default(0),
  estaciones: yup
    .array()
    .of(
      yup.object({
        id_estacion: yup.number().required(),
        nombre: yup.string(),
        tiempo_estimado: yup.number().min(0).default(0),
        instrucciones: yup.string().default(''),
      })
    )
    .min(1, 'Agregá al menos una estación al proceso')
    .required('Agregá al menos una estación'),
});

function ProcesoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [productos, setProductos] = useState([]);
  const [estaciones, setEstaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      id_producto: '',
      tiempo_estimado_total: 0,
      estaciones: [],
    },
  });

  const estacionesSeleccionadas = watch('estaciones') || [];

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        // Primero se cargan los catálogos para que los selectores tengan
        // las opciones disponibles antes de hacer reset() con los valores
        // del proceso a editar.
        const [prodRes, estRes] = await Promise.all([
          productoService.getAll(),
          estacionService.getAll(),
        ]);
        setProductos(Array.isArray(prodRes.data) ? prodRes.data : []);
        setEstaciones(Array.isArray(estRes.data) ? estRes.data : []);

        if (esEdicion) {
          const res = await procesoService.getById(id);
          const p = res.data;
          reset({
            id_producto: Number(p.id_producto),
            tiempo_estimado_total: Number(p.tiempo_estimado_total || 0),
            estaciones: (p.pasos || [])
              .sort((a, b) => Number(a.orden_paso) - Number(b.orden_paso))
              .map((paso) => ({
                id_estacion: Number(paso.id_estacion),
                nombre: paso.nombre_estacion,
                tiempo_estimado: Number(paso.tiempo_estimado || 0),
                instrucciones: paso.instrucciones || '',
              })),
          });
        }
      } catch (err) {
        toast.error(extraerErrorAPI(err, 'No se pudo cargar el formulario'));
        if (esEdicion) navigate('/admin/procesos');
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [id, esEdicion, reset, navigate]);

  const agregarEstacion = (est) => {
    if (!est) return;
    setValue(
      'estaciones',
      [
        ...estacionesSeleccionadas,
        {
          id_estacion: Number(est.id_estacion),
          nombre: est.nombre,
          tiempo_estimado: 0,
          instrucciones: '',
        },
      ],
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const quitarEstacion = (index) => {
    setValue(
      'estaciones',
      estacionesSeleccionadas.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const moverEstacion = (index, direccion) => {
    const nuevo = [...estacionesSeleccionadas];
    const objetivo = index + direccion;
    if (objetivo < 0 || objetivo >= nuevo.length) return;
    [nuevo[index], nuevo[objetivo]] = [nuevo[objetivo], nuevo[index]];
    setValue('estaciones', nuevo, { shouldDirty: true, shouldValidate: true });
  };

  const cambiarTiempoEstacion = (index, valor) => {
    const nuevo = estacionesSeleccionadas.map((e, i) =>
      i === index ? { ...e, tiempo_estimado: Math.max(0, parseInt(valor, 10) || 0) } : e
    );
    setValue('estaciones', nuevo, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setEnviando(true);
    try {
      const payload = {
        id_producto: Number(data.id_producto),
        tiempo_estimado_total: Number(data.tiempo_estimado_total || 0),
        estaciones: data.estaciones.map((e, idx) => ({
          id_estacion: Number(e.id_estacion),
          orden_paso: idx + 1,
          tiempo_estimado: Number(e.tiempo_estimado || 0),
          instrucciones: e.instrucciones || '',
        })),
      };
      if (esEdicion) payload.id_proceso = Number(id);

      const res = esEdicion
        ? await procesoService.update(payload)
        : await procesoService.create(payload);
      toast.success(
        esEdicion
          ? `Proceso de "${res.data.nombre_producto}" actualizado`
          : `Proceso de "${res.data.nombre_producto}" creado`
      );
      navigate('/admin/procesos');
    } catch (err) {
      const data = err.response?.data;
      if (data?.campo === 'id_producto') {
        setError('id_producto', { type: 'server', message: data.mensaje });
        toast.error(data.mensaje);
      } else if (data?.errores) {
        Object.entries(data.errores).forEach(([campo, mensaje]) => {
          if (campo in schema.fields) setError(campo, { type: 'server', message: mensaje });
        });
        toast.error('Revisá los campos con error');
      } else {
        toast.error(extraerErrorAPI(err, 'No se pudo guardar el proceso'));
      }
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <div className="loading">Cargando formulario...</div>;

  return (
    <div className="admin-proceso-form">
      <div className="page-header">
        <Link to="/admin/procesos" className="admin-form-back">&larr; Volver al listado</Link>
        <h1>{esEdicion ? 'Modificar proceso' : 'Nuevo proceso de preparación'}</h1>
        <p>Definí el producto y las estaciones en el orden de preparación</p>
      </div>

      <div className="page-content">
        <form className="admin-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="admin-form-grid">
            <div>
              <Controller
                name="id_producto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Producto *"
                    error={Boolean(errors.id_producto)}
                    helperText={errors.id_producto?.message}
                    disabled={esEdicion}
                  >
                    <MenuItem value="" disabled>
                      Seleccioná un producto
                    </MenuItem>
                    {productos.map((p) => (
                      <MenuItem key={p.id_producto} value={Number(p.id_producto)}>
                        {p.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </div>

            <div>
              <TextField
                label="Tiempo total estimado"
                fullWidth
                type="number"
                inputProps={{ min: '0', step: '1' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">min</InputAdornment>,
                }}
                {...register('tiempo_estimado_total')}
                error={Boolean(errors.tiempo_estimado_total)}
                helperText={
                  errors.tiempo_estimado_total?.message ||
                  'Tiempo total (opcional). Referencial.'
                }
              />
            </div>

            <div className="admin-form-full">
              <Autocomplete
                options={estaciones}
                getOptionLabel={(o) => o.nombre || ''}
                onChange={(_, val) => agregarEstacion(val)}
                value={null}
                clearOnBlur
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Agregar estación al proceso"
                    placeholder="Buscar estación..."
                  />
                )}
              />
              {errors.estaciones && (
                <p style={{ color: '#c53030', fontSize: '0.82rem', marginTop: 8 }}>
                  {errors.estaciones.message}
                </p>
              )}
            </div>

            <div className="admin-form-full">
              {estacionesSeleccionadas.length === 0 ? (
                <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 16 }}>
                  Todavía no hay estaciones en el proceso.
                </p>
              ) : (
                <div className="admin-list-orden">
                  {estacionesSeleccionadas.map((est, idx) => (
                    <div key={`${est.id_estacion}-${idx}`} className="admin-list-orden-item">
                      <div className="admin-list-orden-num">{idx + 1}</div>
                      <div className="admin-list-orden-info">
                        <div className="admin-list-orden-nombre">{est.nombre}</div>
                        <div className="admin-list-orden-desc">
                          Paso {idx + 1} del proceso de preparación
                        </div>
                      </div>
                      <TextField
                        label="Tiempo"
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        value={est.tiempo_estimado}
                        onChange={(e) => cambiarTiempoEstacion(idx, e.target.value)}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">min</InputAdornment>,
                        }}
                        sx={{ width: 130 }}
                      />
                      <div className="admin-list-orden-actions">
                        <button
                          type="button"
                          className="admin-list-orden-btn"
                          disabled={idx === 0}
                          onClick={() => moverEstacion(idx, -1)}
                          title="Mover arriba"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="admin-list-orden-btn"
                          disabled={idx === estacionesSeleccionadas.length - 1}
                          onClick={() => moverEstacion(idx, 1)}
                          title="Mover abajo"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="admin-list-orden-btn"
                          onClick={() => quitarEstacion(idx)}
                          title="Quitar"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-form-actions">
            <Link to="/admin/procesos" className="admin-btn admin-btn-ghost">
              Cancelar
            </Link>
            <button
              type="submit"
              className="admin-btn"
              disabled={enviando || (esEdicion && !isDirty)}
            >
              {enviando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear proceso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProcesoForm;
