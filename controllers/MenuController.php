<?php

class MenuController
{
    private $model;
    private $response;
    private $request;

    public function __construct()
    {
        $this->model = new MenuModel();
        $this->response = new Response();
        $this->request = new Request();
    }

    public function index()
    {
        $menus = $this->model->getAll();
        $this->response->status(200)->toJSON($menus);
    }

    public function mantenimiento()
    {
        Auth::requerir(['Administrador']);
        $menus = $this->model->getAllMantenimiento();
        $this->response->status(200)->toJSON($menus ?? []);
    }

    public function get($id)
    {
        $menu = $this->model->getById($id);
        if (!$menu) {
            $this->response->status(404)->toJSON(null, 'Menú no encontrado');
            return;
        }
        $menu->productos = $this->model->getProductosPorMenu($id) ?? [];
        $menu->combos = $this->model->getCombosPorMenu($id) ?? [];
        $this->response->status(200)->toJSON($menu);
    }

    public function disponible()
    {
        $menu = $this->model->getDisponible();
        if (!$menu) {
            $this->response->status(200)->toJSON([
                'disponible' => false,
                'mensaje' => 'No hay menú disponible en este momento'
            ]);
            return;
        }
        $id = $menu->id_menu;
        $menu->productos = $this->model->getProductosPorMenu($id) ?? [];
        $menu->combos = $this->model->getCombosPorMenu($id) ?? [];
        $menu->disponible = true;
        $this->response->status(200)->toJSON($menu);
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
                'mensaje' => 'Ya existe un menú con ese nombre'
            ], 'Nombre duplicado');
            return;
        }

        $id = $this->model->create($data);
        if (!$id) {
            $this->response->status(500)->toJSON(null, 'No se pudo crear el menú');
            return;
        }
        $this->response->status(201)->toJSON($this->model->getById($id));
    }

    public function update()
    {
        Auth::requerir(['Administrador']);
        $data = $this->parsePayload();
        $id = intval($data['id_menu'] ?? 0);
        if ($id <= 0) {
            $this->response->status(400)->toJSON(null, 'ID de menú requerido');
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
                'mensaje' => 'Ya existe otro menú con ese nombre'
            ], 'Nombre duplicado');
            return;
        }

        $this->model->update($id, $data);
        $this->response->status(200)->toJSON($this->model->getById($id));
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
        $data = $this->parsePayload();
        $id = intval($data['id_menu'] ?? 0);
        if ($id <= 0) {
            $this->response->status(400)->toJSON(null, 'ID de menú requerido');
            return;
        }
        $this->model->setActivo($id, $activo);
        $this->response->status(200)->toJSON(['id_menu' => $id, 'esta_activo' => $activo ? 1 : 0]);
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

        $formatoHora = '/^\d{2}:\d{2}(:\d{2})?$/';
        if (empty($data['hora_inicio']) || !preg_match($formatoHora, $data['hora_inicio'])) {
            $errores['hora_inicio'] = 'Hora de inicio inválida (formato HH:MM)';
        }
        if (empty($data['hora_fin']) || !preg_match($formatoHora, $data['hora_fin'])) {
            $errores['hora_fin'] = 'Hora final inválida (formato HH:MM)';
        }
        if (empty($errores['hora_inicio']) && empty($errores['hora_fin'])) {
            if (strtotime($data['hora_inicio']) >= strtotime($data['hora_fin'])) {
                $errores['hora_fin'] = 'La hora final debe ser posterior a la hora de inicio';
            }
        }

        $tipo = ($data['tipo_disponibilidad'] ?? 'fechas') === 'dias' ? 'dias' : 'fechas';
        if ($tipo === 'fechas') {
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
        } else {
            $dias = $data['dias'] ?? [];
            $validos = is_array($dias) ? array_filter($dias, function ($d) {
                return is_numeric($d) && intval($d) >= 0 && intval($d) <= 6;
            }) : [];
            if (count($validos) < 1) {
                $errores['dias'] = 'Seleccioná al menos un día de la semana';
            }
        }

        $tieneProductos = !empty($data['productos']) && is_array($data['productos']) && count($data['productos']) > 0;
        $tieneCombos = !empty($data['combos']) && is_array($data['combos']) && count($data['combos']) > 0;
        if (!$tieneProductos && !$tieneCombos) {
            $errores['contenido'] = 'El menú debe incluir al menos un producto o combo';
        }
        return $errores;
    }
}
