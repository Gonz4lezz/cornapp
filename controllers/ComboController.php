<?php

class ComboController
{
    private $model;
    private $response;

    public function __construct()
    {
        $this->model = new ComboModel();
        $this->response = new Response();
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
}
