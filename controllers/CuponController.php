<?php

class CuponController
{
    private $model;
    private $response;
    private $request;

    public function __construct()
    {
        $this->model = new CuponModel();
        $this->response = new Response();
        $this->request = new Request();
    }

    // GET /CuponController -> cupones disponibles (slider y página de cupones)
    public function index()
    {
        $cupones = $this->model->getDisponibles();
        $this->response->status(200)->toJSON($cupones ?? []);
    }

    // GET /CuponController/mantenimiento -> todos los cupones (admin)
    public function mantenimiento()
    {
        Auth::requerir(['Administrador']);
        $cupones = $this->model->getAllMantenimiento();
        $this->response->status(200)->toJSON($cupones ?? []);
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
        $id = intval($data->id_cupon ?? 0);
        if ($id <= 0) {
            $this->response->status(400)->toJSON(null, 'ID de cupón requerido');
            return;
        }
        $this->model->setActivo($id, $activo);
        $this->response->status(200)->toJSON(['id_cupon' => $id, 'esta_activo' => $activo ? 1 : 0]);
    }

    // GET /CuponController/{id} -> detalle de un cupón
    public function get($id)
    {
        $cupon = $this->model->getById($id);
        if (!$cupon) {
            $this->response->status(404)->toJSON(null, 'Cupón no encontrado');
            return;
        }
        $this->response->status(200)->toJSON($cupon);
    }

    // GET /CuponController/porProducto/{id} -> cupón vigente del producto (o null)
    public function porProducto($idProducto)
    {
        $cupon = $this->model->getPorProducto($idProducto);
        $this->response->status(200)->toJSON($cupon ?? ['disponible' => false]);
    }

    // GET /CuponController/porCombo/{id} -> cupón vigente del combo (o null)
    public function porCombo($idCombo)
    {
        $cupon = $this->model->getPorCombo($idCombo);
        $this->response->status(200)->toJSON($cupon ?? ['disponible' => false]);
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
        if ($this->model->existeCodigo($data['codigo'])) {
            $this->response->status(409)->toJSON([
                'campo' => 'codigo',
                'mensaje' => 'Ya existe un cupón con ese código'
            ], 'Código duplicado');
            return;
        }

        $id = $this->model->create($data);
        if (!$id) {
            $this->response->status(500)->toJSON(null, 'No se pudo crear el cupón');
            return;
        }
        $this->response->status(201)->toJSON($this->model->getById($id));
    }

    public function update()
    {
        Auth::requerir(['Administrador']);
        $data = $this->parsePayload();
        $id = intval($data['id_cupon'] ?? 0);
        if ($id <= 0) {
            $this->response->status(400)->toJSON(null, 'ID de cupón requerido');
            return;
        }
        $errores = $this->validar($data);
        if (!empty($errores)) {
            $this->response->status(422)->toJSON(['errores' => $errores], 'Datos inválidos');
            return;
        }
        if ($this->model->existeCodigo($data['codigo'], $id)) {
            $this->response->status(409)->toJSON([
                'campo' => 'codigo',
                'mensaje' => 'Ya existe otro cupón con ese código'
            ], 'Código duplicado');
            return;
        }

        $this->model->update($id, $data);
        $this->response->status(200)->toJSON($this->model->getById($id));
    }

    private function parsePayload()
    {
        $json = $this->request->getJSON();
        return $json ? (array)$json : [];
    }

    private function validar($data)
    {
        $errores = [];
        if (empty($data['codigo']) || strlen(trim($data['codigo'])) < 3) {
            $errores['codigo'] = 'El código es obligatorio (mínimo 3 caracteres)';
        }
        if (empty($data['nombre']) || strlen(trim($data['nombre'])) < 3) {
            $errores['nombre'] = 'El nombre es obligatorio (mínimo 3 caracteres)';
        }
        $tipos = ['porcentaje', 'monto_fijo'];
        $tipo = $data['tipo_descuento'] ?? '';
        if (!in_array($tipo, $tipos, true)) {
            $errores['tipo_descuento'] = 'Seleccioná un tipo de descuento válido';
        }
        $valor = isset($data['valor_descuento']) ? floatval($data['valor_descuento']) : 0;
        if ($valor <= 0) {
            $errores['valor_descuento'] = 'El valor del descuento debe ser positivo';
        } elseif ($tipo === 'porcentaje' && $valor > 100) {
            $errores['valor_descuento'] = 'El porcentaje no puede ser mayor a 100';
        }

        $tieneProducto = !empty($data['id_producto']);
        $tieneCombo = !empty($data['id_combo']);
        if ($tieneProducto === $tieneCombo) {
            $errores['objetivo'] = 'El cupón debe aplicar a un producto o a un combo';
        }

        $formatoFecha = '/^\d{4}-\d{2}-\d{2}$/';
        if (empty($data['fecha_inicio']) || !preg_match($formatoFecha, $data['fecha_inicio'])) {
            $errores['fecha_inicio'] = 'Fecha de inicio inválida (formato AAAA-MM-DD)';
        }
        if (empty($data['fecha_fin']) || !preg_match($formatoFecha, $data['fecha_fin'])) {
            $errores['fecha_fin'] = 'Fecha final inválida (formato AAAA-MM-DD)';
        }
        if (empty($errores['fecha_inicio']) && empty($errores['fecha_fin'])) {
            if (strtotime($data['fecha_inicio']) > strtotime($data['fecha_fin'])) {
                $errores['fecha_fin'] = 'La fecha final no puede ser anterior a la fecha de inicio';
            }
        }
        return $errores;
    }
}
