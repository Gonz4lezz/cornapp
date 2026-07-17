<?php

class CategoriaController
{
    private $model;
    private $response;

    public function __construct()
    {
        $this->model = new CategoriaModel();
        $this->response = new Response();
    }

    public function index()
    {
        $categorias = $this->model->getAll();
        $this->response->status(200)->toJSON($categorias ?? []);
    }
}
