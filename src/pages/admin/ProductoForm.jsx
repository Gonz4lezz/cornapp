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
  Chip,
} from '@mui/material';
import {
  productoService,
  categoriaService,
  ingredienteService,
  resolveImageUrl,
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
  descripcion: yup
    .string()
    .required('La descripción es obligatoria')
    .min(10, 'Debe tener al menos 10 caracteres')
    .trim(),
  id_categoria: yup
    .number()
    .typeError('Seleccioná una categoría')
    .required('Seleccioná una categoría')
    .positive('Seleccioná una categoría'),
  precio_base: yup
    .number()
    .typeError('El precio debe ser numérico')
    .required('El precio es obligatorio')
    .positive('El precio debe ser mayor a cero')
    .max(1000000, 'Precio demasiado alto'),
  tiempo_preparacion: yup
    .number()
    .typeError('Ingresá un número')
    .min(0, 'No puede ser negativo')
    .integer('Debe ser un número entero')
    .default(0),
  ingredientes: yup
    .array()
    .of(yup.object({ id_ingrediente: yup.number().required() }))
    .min(1, 'Seleccioná al menos un ingrediente')
    .required('Seleccioná al menos un ingrediente'),
});

function ProductoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [categorias, setCategorias] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [imagenActual, setImagenActual] = useState(null);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenError, setImagenError] = useState(null);

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
      id_categoria: '',
      precio_base: '',
      tiempo_preparacion: 0,
      ingredientes: [],
    },
  });

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const [catRes, ingRes] = await Promise.all([
          categoriaService.getAll(),
          ingredienteService.getAll(),
        ]);
        setCategorias(Array.isArray(catRes.data) ? catRes.data : []);
        setIngredientes(Array.isArray(ingRes.data) ? ingRes.data : []);

        if (esEdicion) {
          const res = await productoService.getById(id);
          const p = res.data;
          const ingSel = (p.ingredientes || []).map((i) => ({
            id_ingrediente: Number(i.id_ingrediente),
            nombre: i.nombre,
          }));
          reset({
            nombre: p.nombre || '',
            descripcion: p.descripcion || '',
            id_categoria: p.id_categoria ? Number(p.id_categoria) : '',
            precio_base: p.precio_base ? Number(p.precio_base) : '',
            tiempo_preparacion: Number(p.tiempo_preparacion || 0),
            ingredientes: ingSel,
          });
          const principal =
            p.imagenes?.find((im) => im.es_principal == 1) || p.imagenes?.[0];
          if (principal) setImagenActual(principal.url_imagen);
        }
      } catch (err) {
        toast.error(extraerErrorAPI(err, 'No se pudo cargar el formulario'));
        if (esEdicion) navigate('/admin/productos');
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [id, esEdicion, reset, navigate]);

  const handleImagenChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenError(null);
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setImagenError('Formato no permitido. Usá JPG, PNG o WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImagenError('La imagen no puede pesar más de 5 MB.');
      return;
    }
    setImagenArchivo(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagenPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    if (!esEdicion && !imagenArchivo) {
      setImagenError('La imagen del producto es obligatoria');
      return;
    }
    setEnviando(true);
    try {
      const formData = new FormData();
      if (esEdicion) formData.append('id_producto', id);
      formData.append('nombre', data.nombre.trim());
      formData.append('descripcion', data.descripcion.trim());
      formData.append('id_categoria', data.id_categoria);
      formData.append('precio_base', data.precio_base);
      formData.append('tiempo_preparacion', data.tiempo_preparacion || 0);
      formData.append(
        'ingredientes',
        JSON.stringify(data.ingredientes.map((i) => ({ id_ingrediente: i.id_ingrediente })))
      );
      if (imagenArchivo) formData.append('imagen', imagenArchivo);

      const res = esEdicion
        ? await productoService.update(formData)
        : await productoService.create(formData);
      toast.success(
        esEdicion ? `Producto "${res.data.nombre}" actualizado` : `Producto "${res.data.nombre}" creado`
      );
      navigate('/admin/productos');
    } catch (err) {
      const data = err.response?.data;
      if (data?.campo === 'nombre') {
        setError('nombre', { type: 'server', message: data.mensaje });
        toast.error(data.mensaje);
      } else if (data?.errores) {
        Object.entries(data.errores).forEach(([campo, mensaje]) => {
          if (campo in schema.fields) setError(campo, { type: 'server', message: mensaje });
        });
        toast.error('Revisá los campos con error');
      } else {
        toast.error(extraerErrorAPI(err, 'No se pudo guardar el producto'));
      }
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <div className="loading">Cargando formulario...</div>;

  const imagenMostrar = imagenPreview || (imagenActual ? resolveImageUrl(imagenActual) : null);

  return (
    <div className="admin-producto-form">
      <div className="page-header">
        <Link to="/admin/productos" className="admin-form-back">&larr; Volver al listado</Link>
        <h1>{esEdicion ? 'Modificar producto' : 'Nuevo producto'}</h1>
        <p>Completá la información del producto</p>
      </div>

      <div className="page-content">
        <form className="admin-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="admin-form-grid">
            <div className="admin-form-full">
              <TextField
                label="Nombre del producto *"
                fullWidth
                {...register('nombre')}
                error={Boolean(errors.nombre)}
                helperText={errors.nombre?.message || 'Debe ser un nombre único y representativo'}
              />
            </div>

            <div className="admin-form-full">
              <TextField
                label="Descripción *"
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
                name="id_categoria"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Categoría *"
                    error={Boolean(errors.id_categoria)}
                    helperText={errors.id_categoria?.message}
                  >
                    <MenuItem value="" disabled>
                      Seleccioná una categoría
                    </MenuItem>
                    {categorias.map((c) => (
                      <MenuItem key={c.id_categoria} value={Number(c.id_categoria)}>
                        {c.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </div>

            <div>
              <TextField
                label="Precio *"
                fullWidth
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                {...register('precio_base')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₡</InputAdornment>,
                }}
                error={Boolean(errors.precio_base)}
                helperText={errors.precio_base?.message}
              />
            </div>

            <div>
              <TextField
                label="Tiempo de preparación"
                fullWidth
                type="number"
                inputProps={{ min: '0', step: '1' }}
                {...register('tiempo_preparacion')}
                InputProps={{
                  endAdornment: <InputAdornment position="end">min</InputAdornment>,
                }}
                error={Boolean(errors.tiempo_preparacion)}
                helperText={errors.tiempo_preparacion?.message || 'Opcional. En minutos.'}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>
                Imagen {esEdicion ? '(cambiar opcional)' : '*'}
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImagenChange}
                style={{ marginTop: 8 }}
              />
              {imagenError && (
                <p style={{ color: '#c53030', fontSize: '0.82rem', marginTop: 6 }}>
                  {imagenError}
                </p>
              )}
              {imagenMostrar && (
                <div className="admin-preview-imagen" style={{ marginTop: 12 }}>
                  <img src={imagenMostrar} alt="Vista previa del producto" />
                </div>
              )}
            </div>

            <div className="admin-form-full">
              <Controller
                name="ingredientes"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={ingredientes.map((i) => ({
                      id_ingrediente: Number(i.id_ingrediente),
                      nombre: i.nombre,
                      es_alergeno: i.es_alergeno,
                    }))}
                    value={field.value || []}
                    onChange={(_, val) => field.onChange(val)}
                    isOptionEqualToValue={(o, v) => o.id_ingrediente === v.id_ingrediente}
                    getOptionLabel={(o) => o.nombre || ''}
                    renderTags={(value, getTagProps) =>
                      value.map((opt, idx) => (
                        <Chip
                          {...getTagProps({ index: idx })}
                          key={opt.id_ingrediente}
                          label={opt.nombre}
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Ingredientes *"
                        placeholder="Buscar y seleccionar ingredientes"
                        error={Boolean(errors.ingredientes)}
                        helperText={
                          errors.ingredientes?.message ||
                          'Podés seleccionar múltiples ingredientes predefinidos'
                        }
                      />
                    )}
                  />
                )}
              />
            </div>
          </div>

          <div className="admin-form-actions">
            <Link to="/admin/productos" className="admin-btn admin-btn-ghost">
              Cancelar
            </Link>
            <button
              type="submit"
              className="admin-btn"
              disabled={enviando || (esEdicion && !isDirty && !imagenArchivo)}
            >
              {enviando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductoForm;
