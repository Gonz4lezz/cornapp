<?php

class CocinaController
{
    private $model;
    private $pedidoModel;
    private $response;
    private $request;

    public function __construct()
    {
        $this->model = new CocinaModel();
        $this->pedidoModel = new PedidoModel();
        $this->response = new Response();
        $this->request = new Request();
    }

    // GET /CocinaController — tablero de cocina (opcional ?estacion=ID).
    public function index()
    {
        Auth::requerir(['Cocina']);
        $idEstacion = $_GET['estacion'] ?? null;
        $this->response->status(200)->toJSON([
            'items' => $this->model->getItems($idEstacion),
        ]);
    }

    // POST /CocinaController/avanzar — avanza un item por su proceso:
    // Al completarse todos los items, la orden y el pedido se actualizan solos.
    public function avanzar()
    {
        $usuario = Auth::requerir(['Cocina']);
        $data = $this->request->getJSON();
        $idItem = intval($data->id_item_cocina ?? 0);

        $item = $this->model->getItem($idItem);
        if (!$item) {
            $this->response->status(404)->toJSON(null, 'El item de cocina no existe');
            return;
        }
        if ($item->estado === 'completado') {
            $this->response->status(409)->toJSON(null, 'El item ya está completado');
            return;
        }

        // Primer avance de la orden: el pedido pasa a "En preparación"
        if ($item->estado_orden === 'pendiente') {
            $this->model->iniciarOrden($item->id_orden_cocina);
            $this->pedidoModel->cambiarEstado(
                $item->id_pedido,
                PedidoModel::ESTADO_EN_PREPARACION,
                $usuario->id_usuario,
                'Cocina inició la preparación'
            );
        }

        if ($item->estado === 'pendiente') {
            // Sin proceso definido: un solo paso, se completa de una vez
            if (!$item->id_estacion_actual) {
                $this->model->completarItem($idItem, $usuario->id_usuario);
            } else {
                $this->model->iniciarItem($idItem);
            }
        } else {
            // En proceso: pasar a la siguiente estación o completar
            $pasos = $this->model->getPasosDeProducto($item->id_producto);
            $siguiente = $this->estacionSiguiente($pasos, $item->id_estacion_actual);
            if ($siguiente !== null) {
                $this->model->moverItem($idItem, $siguiente);
            } else {
                $this->model->completarItem($idItem, $usuario->id_usuario);
            }
        }

        // ¿Terminó toda la orden? El pedido pasa a "Listo" automáticamente
        if (!$this->model->quedanItemsPendientes($item->id_orden_cocina)) {
            $this->model->completarOrden($item->id_orden_cocina);
            $this->pedidoModel->cambiarEstado(
                $item->id_pedido,
                PedidoModel::ESTADO_LISTO,
                $usuario->id_usuario,
                'Preparación finalizada, listo para entregar'
            );
        }

        $this->response->status(200)->toJSON([
            'items' => $this->model->getItems(null),
        ], 'Item actualizado');
    }

    // Estación que sigue en el proceso a partir de la estación actual
    private function estacionSiguiente($pasos, $estacionActual)
    {
        $estacionActual = intval($estacionActual);
        $indiceActual = -1;
        foreach ($pasos as $i => $paso) {
            if (intval($paso->id_estacion) === $estacionActual) {
                $indiceActual = $i;
                break;
            }
        }
        if ($indiceActual === -1 || $indiceActual + 1 >= count($pasos)) {
            return null;
        }
        return intval($pasos[$indiceActual + 1]->id_estacion);
    }
}
