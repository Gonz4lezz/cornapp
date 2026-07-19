import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { TextField, Autocomplete, Chip } from '@mui/material';
import {
  menuService,
  productoService,
  comboService,
} from '../../services/api';
import { extraerErrorAPI } from '../../utils/format';
import './admin-common.css';

const schema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .min(3, 'Debe tener al menos 3 caracteres')
    .max(150, 'No puede exceder 150 caracteres')
    .trim(),
  descripcion: yup.string().optional(),
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
      'La fecha final no puede ser anterior a la fecha de inicio',
      function (value) {
        const { fecha_inicio } = this.parent;
        if (!fecha_inicio || !value) return true;
        return new Date(value) >= new Date(fecha_inicio);
      }
    ),
  hora_inicio: yup
    .string()
    .required('La hora de inicio es obligatoria')
    .matches(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  hora_fin: yup
    .string()
    .required('La hora final es obligatoria')
    .matches(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)')
    .test(
      'rango-horas',
      'La hora final debe ser posterior a la hora de inicio',
      function (value) {
        const { hora_inicio } = this.parent;
        if (!hora_inicio || !value) return true;
        return hora_inicio < value;
      }
    ),
  productos: yup.array().of(yup.object({ id_producto: yup.number().required() })).default([]),
  combos: yup.array().of(yup.object({ id_combo: yup.number().required() })).default([]),
});

const normalizarHora = (valor) => (valor ? valor.substring(0, 5) : '');

function MenuForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [productos, setProductos] = useState([]);
  const [combos, setCombos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [tieneContenido, setTieneContenido] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      hora_inicio: '',
      hora_fin: '',
      productos: [],
      combos: [],
    },
  });

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
          const res = await menuService.getById(id);
          const m = res.data;
          reset({
            nombre: m.nombre || '',
            descripcion: m.descripcion || '',
            fecha_inicio: m.fecha_inicio || '',
            fecha_fin: m.fecha_fin || '',
            hora_inicio: normalizarHora(m.hora_inicio),
            hora_fin: normalizarHora(m.hora_fin),
            productos: (m.productos || []).map((p) => ({
              id_producto: Number(p.id_producto),
              nombre: p.nombre,
            })),
            combos: (m.combos || []).map((c) => ({
              id_combo: Number(c.id_combo),
              nombre: c.nombre,
            })),
          });
        }
      } catch (err) {
        toast.error(extraerErrorAPI(err, 'No se pudo cargar el formulario'));
        if (esEdicion) navigate('/admin/menus');
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [id, esEdicion, reset, navigate]);

  const onSubmit = async (data) => {
    const totalItems = (data.productos?.length || 0) + (data.combos?.length || 0);
    if (totalItems === 0) {
      setTieneContenido(false);
      toast.error('El menú debe incluir al menos un producto o combo');
      return;
    }
    setTieneContenido(true);
    setEnviando(true);
    try {
      const payload = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || '',
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        productos: data.productos.map((p) => ({ id_producto: Number(p.id_producto) })),
        combos: data.combos.map((c) => ({ id_combo: Number(c.id_combo) })),
      };
      if (esEdicion) payload.id_menu = Number(id);

      const res = esEdicion ? await menuService.update(payload) : await menuService.create(payload);
      toast.success(
        esEdicion ? `Menú "${res.data.nombre}" actualizado` : `Menú "${res.data.nombre}" creado`
      );
      navigate('/admin/menus');
    } catch (err) {
      const data = err.response?.data;
      if (data?.campo === 'nombre') {
        setError('nombre', { type: 'server', message: data.mensaje });
        toast.error(data.mensaje);
      } else if (data?.errores) {
        Object.entries(data.errores).forEach(([campo, mensaje]) => {
          if (campo in schema.fields) setError(campo, { type: 'server', message: mensaje });
          if (campo === 'contenido') setTieneContenido(false);
        });
        toast.error('Revisá los campos con error');
      } else {
        toast.error(extraerErrorAPI(err, 'No se pudo guardar el menú'));
      }
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <div className="loading">Cargando formulario...</div>;

  return (
    <div className="admin-menu-form">
      <div className="page-header">
        <Link to="/admin/menus" className="admin-form-back">&larr; Volver al listado</Link>
        <h1>{esEdicion ? 'Modificar menú' : 'Nuevo menú'}</h1>
        <p>Configurá las fechas, horas y contenido del menú</p>
      </div>

      <div className="page-content">
        <form className="admin-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="admin-form-grid">
            <div className="admin-form-full">
              <TextField
                label="Nombre del menú *"
                fullWidth
                {...register('nombre')}
                error={Boolean(errors.nombre)}
                helperText={errors.nombre?.message || 'Debe ser un nombre único'}
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
              <TextField
                label="Fecha de inicio *"
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
                label="Fecha final *"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('fecha_fin')}
                error={Boolean(errors.fecha_fin)}
                helperText={errors.fecha_fin?.message}
              />
            </div>

            <div>
              <TextField
                label="Hora de inicio *"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                slotProps={{ inputLabel: { shrink: true } }}
                inputProps={{ step: 300 }}
                {...register('hora_inicio')}
                error={Boolean(errors.hora_inicio)}
                helperText={errors.hora_inicio?.message}
              />
            </div>

            <div>
              <TextField
                label="Hora final *"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                slotProps={{ inputLabel: { shrink: true } }}
                inputProps={{ step: 300 }}
                {...register('hora_fin')}
                error={Boolean(errors.hora_fin)}
                helperText={errors.hora_fin?.message}
              />
            </div>

            <div className="admin-form-full">
              <Controller
                name="productos"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={productos.map((p) => ({
                      id_producto: Number(p.id_producto),
                      nombre: p.nombre,
                    }))}
                    value={field.value || []}
                    onChange={(_, val) => field.onChange(val)}
                    isOptionEqualToValue={(o, v) => o.id_producto === v.id_producto}
                    getOptionLabel={(o) => o.nombre || ''}
                    renderTags={(value, getTagProps) =>
                      value.map((opt, idx) => (
                        <Chip
                          {...getTagProps({ index: idx })}
                          key={opt.id_producto}
                          label={opt.nombre}
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Productos del menú"
                        placeholder="Seleccioná los productos que conforman el menú"
                      />
                    )}
                  />
                )}
              />
            </div>

            <div className="admin-form-full">
              <Controller
                name="combos"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={combos.map((c) => ({
                      id_combo: Number(c.id_combo),
                      nombre: c.nombre,
                    }))}
                    value={field.value || []}
                    onChange={(_, val) => field.onChange(val)}
                    isOptionEqualToValue={(o, v) => o.id_combo === v.id_combo}
                    getOptionLabel={(o) => o.nombre || ''}
                    renderTags={(value, getTagProps) =>
                      value.map((opt, idx) => (
                        <Chip
                          {...getTagProps({ index: idx })}
                          key={opt.id_combo}
                          label={opt.nombre}
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Combos del menú"
                        placeholder="Seleccioná los combos que conforman el menú"
                      />
                    )}
                  />
                )}
              />
            </div>

            {!tieneContenido && (
              <div className="admin-form-full">
                <p style={{ color: '#c53030', fontSize: '0.85rem', margin: 0 }}>
                  El menú debe incluir al menos un producto o un combo.
                </p>
              </div>
            )}
          </div>

          <div className="admin-form-actions">
            <Link to="/admin/menus" className="admin-btn admin-btn-ghost">
              Cancelar
            </Link>
            <button
              type="submit"
              className="admin-btn"
              disabled={enviando || (esEdicion && !isDirty)}
            >
              {enviando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear menú'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MenuForm;
