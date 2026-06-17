<?php

class MenuController
{
    private $model;
    private $response;

    public function __construct()
    {
        $this->model = new MenuModel();
        $this->response = new Response();
    }

    public function index()
    {
        $menus = $this->model->getAll();
        $this->response->status(200)->toJSON($menus);
    }

    public function get($id)
    {
        $menu = $this->model->getById($id);
        if (!$menu) {
            $this->response->status(404)->toJSON(null, 'Menú no encontrado');
            return;
        }

        $menu->horarios = $this->model->getHorarios($id) ?? [];
        $menu->productos = $this->model->getProductosPorMenu($id) ?? [];
        $menu->combos = $this->model->getCombosPorMenu($id) ?? [];

        $this->response->status(200)->toJSON($menu);
    }

    public function disponible()
    {
        $menu = $this->model->getDisponible();
        if (!$menu) {
            $this->response->status(200)->toJSON(['disponible' => false, 'mensaje' => 'No hay menú disponible en este momento']);
            return;
        }

        $id = $menu->id_menu;
        $menu->horarios = $this->model->getHorarios($id) ?? [];
        $menu->productos = $this->model->getProductosPorMenu($id) ?? [];
        $menu->combos = $this->model->getCombosPorMenu($id) ?? [];
        $menu->disponible = true;

        $this->response->status(200)->toJSON($menu);
    }
}
