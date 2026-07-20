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
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  cuponService,
  productoService,
  comboService,
} from '../../services/api';
import { extraerErrorAPI } from '../../utils/format';
import './admin-common.css';

const schema = yup.object({
  codigo: yup
    .string()
    .required('El código es obligatorio')
    .min(3, 'Debe tener al menos 3 caracteres')
    .max(50, 'No puede exceder 50 caracteres')
    .matches(/^[A-Za-z0-9]+$/, 'Solo letras y números, sin espacios')
    .trim(),
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .min(3, 'Debe tener al menos 3 caracteres')
    .max(150, 'No puede exceder 150 caracteres')
    .trim(),
  descripcion: yup.string().optional(),
  tipo_descuento: yup
    .string()
    .oneOf(['porcentaje', 'monto_fijo'], 'Seleccioná un tipo de descuento')
    .required('Seleccioná un tipo de descuento'),
  valor_descuento: yup
    .number()
    .typeError('El valor debe ser numérico')
    .required('El valor es obligatorio')
    .positive('Debe ser mayor a cero')
    .when('tipo_descuento', {
      is: 'porcentaje',
      then: (s) => s.max(100, 'El porcentaje no puede superar 100'),
    }),
  tipo_objetivo: yup
    .string()
    .oneOf(['producto', 'combo'], 'Elegí a qué aplica')
    .required('Elegí a qué aplica'),
  id_objetivo: yup
    .number()
    .typeError('Seleccioná el producto o combo')
    .required('Seleccioná el producto o combo')
    .positive('Seleccioná el producto o combo'),
  fecha_inicio: yup
    .string()
    .required('La fecha de inicio es obligatoria')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)'),
  fecha_fin: yup
    .string()
    .required('La fecha final es obligatoria')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (AAAA-MM-DD)')
    .test(
      'rango-fechas',
      'La fecha final no puede ser anterior a la de inicio',
      function (value) {
        const { fecha_inicio } = this.parent;
        if (!fecha_inicio || !value) return true;
        return new Date(value) >= new Date(fecha_inicio);
      },
    ),
  esta_activo: yup.boolean(),
});

const soloFecha = (valor) => (valor ? String(valor).substring(0, 10) : '');

function CuponForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [productos, setProductos] = useState([]);
  const [combos, setCombos] = useState([]);
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
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo_descuento: 'porcentaje',
      valor_descuento: '',
      tipo_objetivo: 'producto',
      id_objetivo: '',
      fecha_inicio: '',
      fecha_fin: '',
      esta_activo: true,
    },
  });

  const tipoDescuento = watch('tipo_descuento');
  const tipoObjetivo = watch('tipo_objetivo');
  const idObjetivo = watch('id_objetivo');

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const [prodRes, comboRes] = await Promise.all([
          productoService.getAll(),
          comboService.getAll(),
        ]);
        setProductos(Array.isArray(prodRes.data) ? prodRes.data : []);
        setCombos(Array.isArray(comboRes.data) ? comboRes.data : []);

        if (esEdicion) {
          const res = await cuponService.getById(id);
          const c = res.data;
          reset({
            codigo: c.codigo || '',
            nombre: c.nombre || '',
            descripcion: c.descripcion || '',
            tipo_descuento: c.tipo_descuento || 'porcentaje',
            valor_descuento: c.valor_descuento ? Number(c.valor_descuento) : '',
            tipo_objetivo: c.id_producto != null ? 'producto' : 'combo',
            id_objetivo:
              c.id_producto != null
                ? Number(c.id_producto)
                : Number(c.id_combo),
            fecha_inicio: soloFecha(c.fecha_inicio),
            fecha_fin: soloFecha(c.fecha_fin),
            esta_activo: c.esta_activo == 1,
          });
        }
      } catch (err) {
        toast.error(extraerErrorAPI(err, 'No se pudo cargar el formulario'));
        if (esEdicion) navigate('/admin/cupones');
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [id, esEdicion, reset, navigate]);

  const opcionesObjetivo = tipoObjetivo === 'producto' ? productos : combos;
  const claveId = tipoObjetivo === 'producto' ? 'id_producto' : 'id_combo';
  const objetivoSeleccionado =
    opcionesObjetivo.find((o) => Number(o[claveId]) === Number(idObjetivo)) ||
    null;

  const onSubmit = async (data) => {
    setEnviando(true);
    try {
      const payload = {
        codigo: data.codigo.trim().toUpperCase(),
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || '',
        tipo_descuento: data.tipo_descuento,
        valor_descuento: Number(data.valor_descuento),
        id_producto:
          data.tipo_objetivo === 'producto' ? Number(data.id_objetivo) : null,
        id_combo:
          data.tipo_objetivo === 'combo' ? Number(data.id_objetivo) : null,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        esta_activo: data.esta_activo,
      };
      if (esEdicion) payload.id_cupon = Number(id);

      const res = esEdicion
        ? await cuponService.update(payload)
        : await cuponService.create(payload);
      toast.success(
        esEdicion
          ? `Cupón "${res.data.codigo}" actualizado`
          : `Cupón "${res.data.codigo}" creado`,
      );
      navigate('/admin/cupones');
    } catch (err) {
      const data = err.response?.data;
      if (data?.campo === 'codigo') {
        setError('codigo', { type: 'server', message: data.mensaje });
        toast.error(data.mensaje);
      } else if (data?.errores) {
        Object.entries(data.errores).forEach(([campo, mensaje]) => {
          if (campo in schema.fields)
            setError(campo, { type: 'server', message: mensaje });
        });
        toast.error('Revisá los campos con error');
      } else {
        toast.error(extraerErrorAPI(err, 'No se pudo guardar el cupón'));
      }
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <div className="loading">Cargando formulario...</div>;

  return (
    <div className="admin-cupon-form">
      <div className="page-header">
        <Link to="/admin/cupones" className="admin-form-back">
          &larr; Volver al listado
        </Link>
        <h1>{esEdicion ? 'Modificar cupón' : 'Nuevo cupón'}</h1>
        <p>Configurá el descuento y el producto o combo al que aplica</p>
      </div>

      <div className="page-content">
        <form
          className="admin-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="admin-form-grid">
            <div>
              <TextField
                label="Código *"
                fullWidth
                {...register('codigo')}
                error={Boolean(errors.codigo)}
                helperText={
                  errors.codigo?.message ||
                  'Único, sin espacios (ej: CLASICO15)'
                }
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </div>

            <div>
              <TextField
                label="Nombre del cupón *"
                fullWidth
                {...register('nombre')}
                error={Boolean(errors.nombre)}
                helperText={errors.nombre?.message}
              />
            </div>

            <div className="admin-form-full">
              <TextField
                label="Descripción"
                fullWidth
                multiline
                minRows={2}
                {...register('descripcion')}
                error={Boolean(errors.descripcion)}
                helperText={errors.descripcion?.message}
              />
            </div>

            <div>
              <Controller
                name="tipo_descuento"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Tipo de descuento *"
                    error={Boolean(errors.tipo_descuento)}
                    helperText={errors.tipo_descuento?.message}
                  >
                    <MenuItem value="porcentaje">Porcentaje (%)</MenuItem>
                    <MenuItem value="monto_fijo">Monto fijo (₡)</MenuItem>
                  </TextField>
                )}
              />
            </div>

            <div>
              <TextField
                label="Valor del descuento *"
                fullWidth
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                {...register('valor_descuento')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {tipoDescuento === 'porcentaje' ? '%' : '₡'}
                    </InputAdornment>
                  ),
                }}
                error={Boolean(errors.valor_descuento)}
                helperText={
                  errors.valor_descuento?.message ||
                  (tipoDescuento === 'porcentaje'
                    ? 'Entre 1 y 100'
                    : 'Monto en colones')
                }
              />
            </div>

            <div>
              <Controller
                name="tipo_objetivo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="El cupón aplica a *"
                    onChange={(e) => {
                      field.onChange(e);
                      // Al cambiar de producto a combo (o viceversa) se limpia la selección
                      setValue('id_objetivo', '', { shouldValidate: false });
                    }}
                    error={Boolean(errors.tipo_objetivo)}
                    helperText={errors.tipo_objetivo?.message}
                  >
                    <MenuItem value="producto">Un producto</MenuItem>
                    <MenuItem value="combo">Un combo</MenuItem>
                  </TextField>
                )}
              />
            </div>

            <div>
              <Autocomplete
                options={opcionesObjetivo}
                getOptionLabel={(o) => o.nombre || ''}
                value={objetivoSeleccionado}
                isOptionEqualToValue={(o, v) =>
                  Number(o[claveId]) === Number(v[claveId])
                }
                onChange={(_, val) =>
                  setValue('id_objetivo', val ? Number(val[claveId]) : '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      tipoObjetivo === 'producto' ? 'Producto *' : 'Combo *'
                    }
                    placeholder={`Seleccioná el ${tipoObjetivo}`}
                    error={Boolean(errors.id_objetivo)}
                    helperText={errors.id_objetivo?.message}
                  />
                )}
              />
            </div>

            <div>
              <TextField
                label="Vigente desde *"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('fecha_inicio')}
                error={Boolean(errors.fecha_inicio)}
                helperText={errors.fecha_inicio?.message}
              />
            </div>

            <div>
              <TextField
                label="Vigente hasta *"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('fecha_fin')}
                error={Boolean(errors.fecha_fin)}
                helperText={errors.fecha_fin?.message}
              />
            </div>

            <div className="admin-form-full">
              <Controller
                name="esta_activo"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Cupón activo"
                  />
                )}
              />
            </div>
          </div>

          <div className="admin-form-actions">
            <Link to="/admin/cupones" className="admin-btn admin-btn-ghost">
              Cancelar
            </Link>
            <button
              type="submit"
              className="admin-btn"
              disabled={enviando || (esEdicion && !isDirty)}
            >
              {enviando
                ? 'Guardando...'
                : esEdicion
                  ? 'Guardar cambios'
                  : 'Crear cupón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CuponForm;
