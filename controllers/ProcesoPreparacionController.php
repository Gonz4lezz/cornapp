<?php

class ProcesoPreparacionController
{
    private $model;
    private $response;
    private $request;

    public function __construct()
    {
        $this->model = new ProcesoPreparacionModel();
        $this->response = new Response();
        $this->request = new Request();
    }

    public function index()
    {
        $procesos = $this->model->getAll();
        $this->response->status(200)->toJSON($procesos);
    }

    public function get($id)
    {
        $proceso = $this->model->getById($id);
        if (!$proceso) {
            $this->response->status(404)->toJSON(null, 'Proceso de preparación no encontrado');
            return;
        }

        $proceso->pasos = $this->model->getPasos($id) ?? [];

        $this->response->status(200)->toJSON($proceso);
    }

    public function productosDisponibles()
    {
        $productos = $this->model->productosDisponibles();
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
        if ($this->model->existeParaProducto($data['id_producto'])) {
            $this->response->status(409)->toJSON([
                'campo' => 'id_producto',
                'mensaje' => 'Este producto ya tiene un proceso de preparación registrado'
            ], 'Proceso duplicado');
            return;
        }

        $id = $this->model->create($data);
        if (!$id) {
            $this->response->status(500)->toJSON(null, 'No se pudo crear el proceso');
            return;
        }
        $proceso = $this->model->getById($id);
        $proceso->pasos = $this->model->getPasos($id) ?? [];
        $this->response->status(201)->toJSON($proceso);
    }

    public function update()
    {
        $data = $this->parsePayload();
        $id = intval($data['id_proceso'] ?? 0);
        if ($id <= 0) {
            $this->response->status(400)->toJSON(null, 'ID de proceso requerido');
            return;
        }
        $errores = $this->validar($data);
        if (!empty($errores)) {
            $this->response->status(422)->toJSON(['errores' => $errores], 'Datos inválidos');
            return;
        }
        if ($this->model->existeParaProducto($data['id_producto'], $id)) {
            $this->response->status(409)->toJSON([
                'campo' => 'id_producto',
                'mensaje' => 'Otro proceso ya está asignado a este producto'
            ], 'Proceso duplicado');
            return;
        }

        $this->model->update($id, $data);
        $proceso = $this->model->getById($id);
        $proceso->pasos = $this->model->getPasos($id) ?? [];
        $this->response->status(200)->toJSON($proceso);
    }

    private function parsePayload()
    {
        $json = $this->request->getJSON();
        return $json ? (array)$json : [];
    }

    private function validar($data)
    {
        $errores = [];
        if (empty($data['id_producto']) || intval($data['id_producto']) <= 0) {
            $errores['id_producto'] = 'Debe seleccionar un producto';
        }
        if (empty($data['estaciones']) || !is_array($data['estaciones']) || count($data['estaciones']) < 1) {
            $errores['estaciones'] = 'Debe agregar al menos una estación al proceso';
        } else {
            $ordenes = [];
            foreach ($data['estaciones'] as $e) {
                $arr = (array)$e;
                if (empty($arr['id_estacion']) || intval($arr['id_estacion']) <= 0) {
                    $errores['estaciones'] = 'Cada estación debe tener un identificador válido';
                    break;
                }
                if (isset($arr['orden_paso'])) {
                    $ordenes[] = intval($arr['orden_paso']);
                }
            }
            if (!empty($ordenes) && count($ordenes) !== count(array_unique($ordenes))) {
                $errores['estaciones'] = 'El orden de las estaciones no puede repetirse';
            }
        }
        return $errores;
    }
}