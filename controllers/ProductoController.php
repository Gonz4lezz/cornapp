<?php

class ProductoController
{
    private $model;
    private $response;

    public function __construct()
    {
        $this->model = new ProductoModel();
        $this->response = new Response();
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
}
