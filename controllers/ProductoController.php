<?php

class ProductoController
{
    private $model;
    private $response;
    private $request;

    public function __construct()
    {
        $this->model = new ProductoModel();
        $this->response = new Response();
        $this->request = new Request();
    }

    public function index()
    {
        $productos = $this->model->getAll();
        $this->response->status(200)->toJSON($productos);
    }

    public function get($id)
    {
        $producto = $this->model->getById($id);
        if (!$producto) {
            $this->response->status(404)->toJSON(null, 'Producto no encontrado');
            return;
        }

        $producto->ingredientes = $this->model->getIngredientes($id) ?? [];
        $producto->imagenes = $this->model->getImagenes($id) ?? [];

        $this->response->status(200)->toJSON($producto);
    }

    public function mantenimiento()
    {
        $productos = $this->model->getAllMantenimiento();
        $this->response->status(200)->toJSON($productos ?? []);
    }

    public function create()
    {
        $data = $this->parsePayload();
        $errores = $this->validar($data);
        if (!empty($errores)) {
            $this->response->status(422)->toJSON(['errores' => $errores], 'Datos inválidos');
            return;
        }

        if ($this->model->existeNombre($data['nombre'])) {
            $this->response->status(409)->toJSON([
                'campo' => 'nombre',
                'mensaje' => 'Ya existe un producto con ese nombre'
            ], 'Nombre duplicado');
            return;
        }

        if (!empty($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $urlImagen = $this->guardarImagen($_FILES['imagen']);
            if ($urlImagen === null) {
                $this->response->status(400)->toJSON(null, 'Error al guardar la imagen');
                return;
            }
            $data['imagen_url'] = $urlImagen;
            $data['imagen_alt'] = $data['nombre'];
        }

        $id = $this->model->create($data);
        if (!$id) {
            $this->response->status(500)->toJSON(null, 'No se pudo crear el producto');
            return;
        }

        $producto = $this->model->getById($id);
        $producto->ingredientes = $this->model->getIngredientes($id) ?? [];
        $producto->imagenes = $this->model->getImagenes($id) ?? [];
        $this->response->status(201)->toJSON($producto);
    }

    public function update()
    {
        $data = $this->parsePayload();
        $id = intval($data['id_producto'] ?? 0);
        if ($id <= 0) {
            $this->response->status(400)->toJSON(null, 'ID de producto requerido');
            return;
        }

        $errores = $this->validar($data);
        if (!empty($errores)) {
            $this->response->status(422)->toJSON(['errores' => $errores], 'Datos inválidos');
            return;
        }

        if ($this->model->existeNombre($data['nombre'], $id)) {
            $this->response->status(409)->toJSON([
                'campo' => 'nombre',
                'mensaje' => 'Ya existe otro producto con ese nombre'
            ], 'Nombre duplicado');
            return;
        }

        if (!empty($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $urlImagen = $this->guardarImagen($_FILES['imagen']);
            if ($urlImagen === null) {
                $this->response->status(400)->toJSON(null, 'Error al guardar la imagen');
                return;
            }
            $data['imagen_url'] = $urlImagen;
            $data['imagen_alt'] = $data['nombre'];
        }

        $this->model->update($id, $data);

        $producto = $this->model->getById($id);
        $producto->ingredientes = $this->model->getIngredientes($id) ?? [];
        $producto->imagenes = $this->model->getImagenes($id) ?? [];
        $this->response->status(200)->toJSON($producto);
    }

    private function parsePayload()
    {
        if (!empty($_POST)) {
            $body = [];
            foreach ($_POST as $key => $value) {
                $body[$key] = $value;
            }
            if (isset($body['ingredientes']) && is_string($body['ingredientes'])) {
                $decoded = json_decode($body['ingredientes'], true);
                $body['ingredientes'] = is_array($decoded) ? $decoded : [];
            }
            return $body;
        }
        $json = $this->request->getJSON();
        return $json ? (array)$json : [];
    }

    private function validar($data)
    {
        $errores = [];
        if (empty($data['nombre']) || strlen(trim($data['nombre'])) < 3) {
            $errores['nombre'] = 'El nombre es obligatorio y debe tener al menos 3 caracteres';
        } elseif (strlen($data['nombre']) > 150) {
            $errores['nombre'] = 'El nombre no puede exceder 150 caracteres';
        }
        if (empty($data['descripcion']) || strlen(trim($data['descripcion'])) < 10) {
            $errores['descripcion'] = 'La descripción es obligatoria y debe tener al menos 10 caracteres';
        }
        if (empty($data['id_categoria']) || intval($data['id_categoria']) <= 0) {
            $errores['id_categoria'] = 'Debe seleccionar una categoría';
        }
        if (!isset($data['precio_base']) || floatval($data['precio_base']) <= 0) {
            $errores['precio_base'] = 'El precio debe ser un valor positivo';
        }
        if (empty($data['ingredientes']) || !is_array($data['ingredientes']) || count($data['ingredientes']) === 0) {
            $errores['ingredientes'] = 'Debe seleccionar al menos un ingrediente';
        }
        return $errores;
    }

    private function guardarImagen($file)
    {
        $permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!in_array($file['type'], $permitidos)) {
            return null;
        }
        if ($file['size'] > 5 * 1024 * 1024) {
            return null;
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $nombre = 'producto_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . strtolower($ext);
        $destino = __DIR__ . '/../assets/uploads/' . $nombre;

        if (!is_dir(dirname($destino))) {
            mkdir(dirname($destino), 0755, true);
        }

        if (move_uploaded_file($file['tmp_name'], $destino)) {
            return '/assets/uploads/' . $nombre;
        }
        return null;
    }
}
