<?php

class ProcesoPreparacionController
{
    private $model;
    private $response;

    public function __construct()
    {
        $this->model = new ProcesoPreparacionModel();
        $this->response = new Response();
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
}
