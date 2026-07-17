<?php

class IngredienteController
{
    private $model;
    private $response;

    public function __construct()
    {
        $this->model = new IngredienteModel();
        $this->response = new Response();
    }

    public function index()
    {
        $ingredientes = $this->model->getAll();
        $this->response->status(200)->toJSON($ingredientes ?? []);
    }
}
