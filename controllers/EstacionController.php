<?php

class EstacionController
{
    private $model;
    private $response;

    public function __construct()
    {
        $this->model = new EstacionModel();
        $this->response = new Response();
    }

    public function index()
    {
        $estaciones = $this->model->getAll();
        $this->response->status(200)->toJSON($estaciones ?? []);
    }
}
