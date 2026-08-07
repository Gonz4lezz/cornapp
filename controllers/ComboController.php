<?php

class ComboController
{
    private $model;
    private $response;
    private $request;

    public function __construct()
    {
        $this->model = new ComboModel();
        $this->response = new Response();
        $this->request = new Request();
    }

    public function index()
    {
        $combos = $this->model->getAll();
        $this->response->status(200)->toJSON($combos);
    }

    public function get($id)
    {
        $combo = $this->model->getById($id);
        if (!$combo) {
            $this->response->status(404)->toJSON(null, 'Combo no encontrado');
            return;
        }

        $combo->productos = $this->model->getProductos($id) ?? [];
        $combo->imagenes = $this->model->getImagenes($id) ?? [];

        $this->response->status(200)->toJSON($combo);
    }

    public function mantenimiento()
    {
        Auth::requerir(['Administrador']);
        $combos = $this->model->getAllMantenimiento();
        $this->response->status(200)->toJSON($combos ?? []);
    }

    public function desactivar()
    {
        $this->cambiarEstado(false);
    }

    public function activar()
    {
        $this->cambiarEstado(true);
    }

    private function cambiarEstado($activo)
    {
        Auth::requerir(['Administrador']);
        $data = $this->request->getJSON();
        $id = intval($data->id_combo ?? 0);
        if ($id <= 0) {
            $this->response->status(400)->toJSON(null, 'ID de combo requerido');
            return;
        }
        $this->model->setActivo($id, $activo);
        $this->response->status(200)->toJSON(['id_combo' => $id, 'esta_activo' => $activo ? 1 : 0]);
    }

    public function create()
    {
        Auth::requerir(['Administrador']);
        $data = $this->parsePayload();
        $errores = $this->validar($data);
        if (!empty($errores)) {
            $this->response->status(422)->toJSON(['errores' => $errores], 'Datos inválidos');
            return;
        }
        if ($this->model->existeNombre($data['nombre'])) {
            $this->response->status(409)->toJSON([
                'campo' => 'nombre',
                'mensaje' => 'Ya existe un combo con ese nombre'
            ], 'Nombre duplicado');
            return;
        }

        $id = $this->model->create($data);
        if (!$id) {
            $this->response->status(500)->toJSON(null, 'No se pudo crear el combo');
            return;
        }

        $combo = $this->model->getById($id);
        $combo->productos = $this->model->getProductos($id) ?? [];
        $combo->imagenes = $this->model->getImagenes($id) ?? [];
        $this->response->status(201)->toJSON($combo);
    }

    public function update()
    {
        Auth::requerir(['Administrador']);
        $data = $this->parsePayload();
        $id = intval($data['id_combo'] ?? 0);
        if ($id <= 0) {
            $this->response->status(400)->toJSON(null, 'ID de combo requerido');
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
                'mensaje' => 'Ya existe otro combo con ese nombre'
            ], 'Nombre duplicado');
            return;
        }

        $this->model->update($id, $data);

        $combo = $this->model->getById($id);
        $combo->productos = $this->model->getProductos($id) ?? [];
        $combo->imagenes = $this->model->getImagenes($id) ?? [];
        $this->response->status(200)->toJSON($combo);
    }

    private function parsePayload()
    {
        $json = $this->request->getJSON();
        return $json ? (array)$json : [];
    }

    private function validar($data)
    {
        $errores = [];
        if (empty($data['nombre']) || strlen(trim($data['nombre'])) < 3) {
            $errores['nombre'] = 'El nombre es obligatorio y debe tener al menos 3 caracteres';
        }
        if (!isset($data['precio_combo']) || floatval($data['precio_combo']) <= 0) {
            $errores['precio_combo'] = 'El precio del combo debe ser positivo';
        }
        if (empty($data['productos']) || !is_array($data['productos']) || count($data['productos']) < 1) {
            $errores['productos'] = 'Debe agregar al menos un producto al combo';
        }
        return $errores;
    }
}
