<?php

/**
 * Descarga de la factura del pedido en PDF.
 *
 * El PDF se arma en el servidor, así que el archivo que se descarga desde
 * aquí es exactamente el mismo que se envía por correo al confirmar el
 * pedido.
 */
class FacturaController
{
    const ROLES = ['Cliente', 'Encargado', 'Administrador'];

    private $model;
    private $response;

    public function __construct()
    {
        $this->model = new PedidoModel();
        $this->response = new Response();
    }

    /**
     * GET /FacturaController/descargar/{id}
     * Devuelve el PDF de la factura como archivo descargable.
     */
    public function descargar($idPedido)
    {
        $pedido = $this->pedidoAutorizado($idPedido);
        if (!$pedido) {
            return;
        }

        $pdf = FacturaPDF::generar($pedido);

        // Se reemplaza el encabezado JSON que pone index.php por el del archivo
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . FacturaPDF::nombreArchivo($pedido) . '"');
        header('Content-Length: ' . strlen($pdf));
        http_response_code(200);
        echo $pdf;
    }

    /**
     * Busca el pedido y valida el permiso. Si algo falla ya responde con el
     * error correspondiente y devuelve null.
     */
    private function pedidoAutorizado($idPedido)
    {
        $usuario = Auth::requerir(self::ROLES);
        $pedido = $this->model->getDetalle(intval($idPedido));

        if (!$pedido) {
            $this->response->status(404)->toJSON(null, 'Pedido no encontrado');
            return null;
        }
        // El cliente solo puede pedir la factura de sus propios pedidos
        if ($usuario->rol === 'Cliente'
            && intval($pedido->id_cliente) !== intval($usuario->id_usuario)) {
            $this->response->status(403)->toJSON(null, 'No tiene permisos para ver esta factura');
            return null;
        }

        return $pedido;
    }
}
