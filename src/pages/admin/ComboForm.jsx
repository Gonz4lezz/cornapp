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
  IconButton,
} from '@mui/material';
import {
  comboService,
  productoService,
  categoriaService,
} from '../../services/api';
import { extraerErrorAPI, formatoMoneda } from '../../utils/format';
import './admin-common.css';

const schema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .min(3, 'Debe tener al menos 3 caracteres')
    .max(150, 'No puede exceder 150 caracteres')
    .trim(),
  descripcion: yup.string().optional(),
  id_categoria: yup
    .number()
    .typeError('Seleccioná una categoría')
    .required('Seleccioná una categoría')
    .positive('Seleccioná una categoría'),
  precio_combo: yup
    .number()
    .typeError('El precio debe ser numérico')
    .required('El precio es obligatorio')
    .positive('El precio debe ser mayor a cero')
    .max(1000000, 'Precio demasiado alto'),
  productos: yup
    .array()
    .of(
      yup.object({
        id_producto: yup.number().required(),
        nombre: yup.string(),
        cantidad: yup
          .number()
          .typeError('Cantidad numérica')
          .integer('Entero')
          .min(1, 'Mín. 1')
          .required('Cantidad requerida'),
      })
    )
    .min(1, 'Agregá al menos un producto')
    .required('Agregá al menos un producto'),
});

function ComboForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
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
      nombre: '',
      descripcion: '',
      id_categoria: '',
      precio_combo: '',
      productos: [],
    },
  });

  const productosSeleccionados = watch('productos') || [];

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          categoriaService.getAll(),
          productoService.getAll(),
        ]);
        setCategorias(Array.isArray(catRes.data) ? catRes.data : []);
        setProductos(Array.isArray(prodRes.data) ? prodRes.data : []);

        if (esEdicion) {
          const res = await comboService.getById(id);
          const c = res.data;
          reset({
            nombre: c.nombre || '',
            descripcion: c.descripcion || '',
            id_categoria: c.id_categoria ? Number(c.id_categoria) : '',
            precio_combo: c.precio_combo ? Number(c.precio_combo) : '',
            productos: (c.productos || []).map((p) => ({
              id_producto: Number(p.id_producto),
              nombre: p.nombre,
              cantidad: Number(p.cantidad),
            })),
          });
        }
      } catch (err) {
        toast.error(extraerErrorAPI(err, 'No se pudo cargar el formulario'));
        if (esEdicion) navigate('/admin/combos');
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [id, esEdicion, reset, navigate]);

  const onSubmit = async (data) => {
    setEnviando(true);
    try {
      const payload = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || '',
        id_categoria: Number(data.id_categoria),
        precio_combo: Number(data.precio_combo),
        productos: data.productos.map((p) => ({
          id_producto: Number(p.id_producto),
          cantidad: Number(p.cantidad),
        })),
      };
      if (esEdicion) payload.id_combo = Number(id);

      const res = esEdicion ? await comboService.update(payload) : await comboService.create(payload);
      toast.success(
        esEdicion ? `Combo "${res.data.nombre}" actualizado` : `Combo "${res.data.nombre}" creado`
      );
      navigate('/admin/combos');
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
        toast.error(extraerErrorAPI(err, 'No se pudo guardar el combo'));
      }
    } finally {
      setEnviando(false);
    }
  };

  const agregarProducto = (producto) => {
    if (!producto) return;
    const yaExiste = productosSeleccionados.some((p) => p.id_producto === Number(producto.id_producto));
    if (yaExiste) {
      toast.error(`"${producto.nombre}" ya está en el combo`);
      return;
    }
    setValue(
      'productos',
      [
        ...productosSeleccionados,
        { id_producto: Number(producto.id_producto), nombre: producto.nombre, cantidad: 1 },
      ],
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const quitarProducto = (idProd) => {
    setValue(
      'productos',
      productosSeleccionados.filter((p) => p.id_producto !== idProd),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const cambiarCantidad = (idProd, valor) => {
    const cantidad = Math.max(1, parseInt(valor, 10) || 1);
    setValue(
      'productos',
      productosSeleccionados.map((p) =>
        p.id_producto === idProd ? { ...p, cantidad } : p
      ),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  if (cargando) return <div className="loading">Cargando formulario...</div>;

  return (
    <div className="admin-combo-form">
      <div className="page-header">
        <Link to="/admin/combos" className="admin-form-back">&larr; Volver al listado</Link>
        <h1>{esEdicion ? 'Modificar combo' : 'Nuevo combo'}</h1>
        <p>Configurá los datos del combo y sus productos</p>
      </div>

      <div className="page-content">
        <form className="admin-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="admin-form-grid">
            <div className="admin-form-full">
              <TextField
                label="Nombre del combo *"
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
                label="Precio del combo *"
                fullWidth
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₡</InputAdornment>,
                }}
                {...register('precio_combo')}
                error={Boolean(errors.precio_combo)}
                helperText={errors.precio_combo?.message}
              />
            </div>

            <div className="admin-form-full">
              <Autocomplete
                options={productos}
                getOptionLabel={(o) => `${o.nombre} — ${formatoMoneda(o.precio_base)}`}
                isOptionEqualToValue={(o, v) => o.id_producto === v.id_producto}
                onChange={(_, val) => agregarProducto(val)}
                value={null}
                clearOnBlur
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Agregar producto al combo"
                    placeholder="Buscar producto..."
                  />
                )}
              />
              {errors.productos && (
                <p style={{ color: '#c53030', fontSize: '0.82rem', marginTop: 8 }}>
                  {errors.productos.message}
                </p>
              )}
            </div>

            <div className="admin-form-full">
              {productosSeleccionados.length === 0 ? (
                <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 16 }}>
                  Todavía no hay productos en este combo.
                </p>
              ) : (
                <div className="admin-list-orden">
                  {productosSeleccionados.map((p) => (
                    <div key={p.id_producto} className="admin-list-orden-item">
                      <div className="admin-list-orden-info">
                        <div className="admin-list-orden-nombre">{p.nombre}</div>
                      </div>
                      <TextField
                        label="Cantidad"
                        type="number"
                        size="small"
                        inputProps={{ min: 1, step: 1 }}
                        value={p.cantidad}
                        onChange={(e) => cambiarCantidad(p.id_producto, e.target.value)}
                        sx={{ width: 110 }}
                      />
                      <IconButton
                        aria-label="Quitar producto"
                        onClick={() => quitarProducto(p.id_producto)}
                        size="small"
                        color="error"
                      >
                        ✕
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-form-actions">
            <Link to="/admin/combos" className="admin-btn admin-btn-ghost">
              Cancelar
            </Link>
            <button
              type="submit"
              className="admin-btn"
              disabled={enviando || (esEdicion && !isDirty)}
            >
              {enviando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear combo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComboForm;
