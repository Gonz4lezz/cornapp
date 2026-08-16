<?php

/**
 * Tablero de control: estadísticas para administrador y encargado.
 */
class DashboardController
{
    private $model;
    private $response;

    public function __construct()
    {
        $this->model = new DashboardModel();
        $this->response = new Response();
    }

    // GET /DashboardController — datos de los gráficos y el resumen del día
    public function index()
    {
        Auth::requerir(['Administrador', 'Encargado']);
        $this->response->status(200)->toJSON([
            'topProductos' => $this->model->getTopProductos(3),
            'pedidosPorEstado' => $this->model->getPedidosPorEstadoHoy(),
            'resumenHoy' => $this->model->getResumenHoy(),
            'fecha' => date('Y-m-d'),
        ]);
    }
}
