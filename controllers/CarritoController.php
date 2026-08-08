<?php

class CarritoController
{
    const ROLES_COMPRA = ['Cliente', 'Encargado', 'Administrador'];

    private $model;
    private $response;
    private $request;

    public function __construct()
    {
        $this->model = new CarritoModel();
        $this->response = new Response();
        $this->request = new Request();
    }

    // GET /CarritoController — carrito completo del usuario autenticado
    public function index()
    {
        $usuario = Auth::requerir(self::ROLES_COMPRA);
        $this->responderCarrito($usuario->id_usuario);
    }

    // POST /CarritoController/agregar — agrega un producto o combo
    public function agregar()
    {
        $usuario = Auth::requerir(self::ROLES_COMPRA);
        $data = $this->request->getJSON();
        $idProducto = intval($data->id_producto ?? 0);
        $idCombo = intval($data->id_combo ?? 0);
        $cantidad = intval($data->cantidad ?? 1);

        if (($idProducto > 0) === ($idCombo > 0)) {
            $this->response->status(422)->toJSON(null, 'Debe indicar un producto o un combo');
            return;
        }
        if ($cantidad < 1 || $cantidad > 99) {
            $this->response->status(422)->toJSON(null, 'La cantidad debe estar entre 1 y 99');
            return;
        }

        $this->model->agregar($usuario->id_usuario, $idProducto ?: null, $idCombo ?: null, $cantidad);
        $this->responderCarrito($usuario->id_usuario);
    }

    // POST /CarritoController/actualizar — cambia la cantidad de una línea
    public function actualizar()
    {
        $usuario = Auth::requerir(self::ROLES_COMPRA);
        $data = $this->request->getJSON();
        $idCarrito = intval($data->id_carrito ?? 0);
        $cantidad = intval($data->cantidad ?? 0);

        $item = $this->model->getItem($idCarrito, $usuario->id_usuario);
        if (!$item) {
            $this->response->status(404)->toJSON(null, 'La línea no existe en su carrito');
            return;
        }

        // Cantidad 0 = borrar la línea (regla del enunciado)
        if ($cantidad === 0) {
            $this->model->eliminar($idCarrito, $usuario->id_usuario);
            $this->model->limpiarCuponesHuerfanos($usuario->id_usuario);
            $this->responderCarrito($usuario->id_usuario);
            return;
        }
        if ($cantidad < 0 || $cantidad > 99) {
            $this->response->status(422)->toJSON(null, 'La cantidad debe estar entre 0 y 99');
            return;
        }

        $this->model->actualizarCantidad($idCarrito, $usuario->id_usuario, $cantidad);
        $this->responderCarrito($usuario->id_usuario);
    }

    // POST /CarritoController/observaciones — observaciones de preparación por línea
    public function observaciones()
    {
        $usuario = Auth::requerir(self::ROLES_COMPRA);
        $data = $this->request->getJSON();
        $idCarrito = intval($data->id_carrito ?? 0);
        $observaciones = $data->observaciones ?? null;

        $item = $this->model->getItem($idCarrito, $usuario->id_usuario);
        if (!$item) {
            $this->response->status(404)->toJSON(null, 'La línea no existe en su carrito');
            return;
        }

        $this->model->actualizarObservaciones($idCarrito, $usuario->id_usuario, $observaciones);
        $this->responderCarrito($usuario->id_usuario);
    }

    // POST /CarritoController/eliminar — borra una línea con el botón
    public function eliminar()
    {
        $usuario = Auth::requerir(self::ROLES_COMPRA);
        $data = $this->request->getJSON();
        $idCarrito = intval($data->id_carrito ?? 0);

        $item = $this->model->getItem($idCarrito, $usuario->id_usuario);
        if (!$item) {
            $this->response->status(404)->toJSON(null, 'La línea no existe en su carrito');
            return;
        }

        $this->model->eliminar($idCarrito, $usuario->id_usuario);
        $this->model->limpiarCuponesHuerfanos($usuario->id_usuario);
        $this->responderCarrito($usuario->id_usuario);
    }

    // POST /CarritoController/aplicarCupon — aplica un cupón por su código
    public function aplicarCupon()
    {
        $usuario = Auth::requerir(self::ROLES_COMPRA);
        $data = $this->request->getJSON();
        $codigo = trim($data->codigo ?? '');

        if ($codigo === '') {
            $this->response->status(422)->toJSON(null, 'Debe ingresar el código del cupón');
            return;
        }

        $cupon = $this->model->getCuponVigentePorCodigo($codigo);
        if (!$cupon) {
            $this->response->status(404)->toJSON(null, 'El cupón no existe o ya no está vigente');
            return;
        }
        if ($cupon->limite_usos !== null && intval($cupon->cantidad_usos) >= intval($cupon->limite_usos)) {
            $this->response->status(409)->toJSON(null, 'El cupón alcanzó su límite de usos');
            return;
        }

        // El cupón aplica a UN producto o combo: debe estar en el carrito
        $items = $this->model->getItems($usuario->id_usuario);
        $enCarrito = false;
        foreach ((array)$items as $item) {
            if ($cupon->id_producto && intval($item->id_producto) === intval($cupon->id_producto)) {
                $enCarrito = true;
            }
            if ($cupon->id_combo && intval($item->id_combo) === intval($cupon->id_combo)) {
                $enCarrito = true;
            }
        }
        if (!$enCarrito) {
            $this->response->status(409)->toJSON([
                'requiere' => $cupon->id_producto ? 'producto' : 'combo',
                'id_producto' => $cupon->id_producto,
                'id_combo' => $cupon->id_combo,
            ], 'Para usar este cupón agregue primero el artículo al que aplica');
            return;
        }

        // Monto mínimo del pedido (si el cupón lo define)
        if (!empty($cupon->monto_minimo_pedido)) {
            $subtotal = 0;
            foreach ((array)$items as $item) {
                $subtotal += floatval($item->precio_unitario) * intval($item->cantidad);
            }
            if ($subtotal < floatval($cupon->monto_minimo_pedido)) {
                $this->response->status(409)->toJSON(
                    null,
                    'Este cupón requiere un pedido mínimo de ₡' . number_format(floatval($cupon->monto_minimo_pedido), 0)
                );
                return;
            }
        }

        // Solo un cupón por producto/combo del carrito
        $aplicados = $this->model->getCupones($usuario->id_usuario);
        foreach ((array)$aplicados as $aplicado) {
            if (intval($aplicado->id_cupon) === intval($cupon->id_cupon)) {
                $this->response->status(409)->toJSON(null, 'Ese cupón ya está aplicado en su carrito');
                return;
            }
            $mismoProducto = $cupon->id_producto && intval($aplicado->id_producto) === intval($cupon->id_producto);
            $mismoCombo = $cupon->id_combo && intval($aplicado->id_combo) === intval($cupon->id_combo);
            if ($mismoProducto || $mismoCombo) {
                $this->response->status(409)->toJSON(null, 'Ya hay un cupón aplicado para ese artículo');
                return;
            }
        }

        $this->model->aplicarCupon($usuario->id_usuario, $cupon->id_cupon);
        $this->responderCarrito($usuario->id_usuario, 'Cupón ' . $cupon->codigo . ' aplicado');
    }

    // POST /CarritoController/quitarCupon
    public function quitarCupon()
    {
        $usuario = Auth::requerir(self::ROLES_COMPRA);
        $data = $this->request->getJSON();
        $idCupon = intval($data->id_cupon ?? 0);

        $this->model->quitarCupon($usuario->id_usuario, $idCupon);
        $this->responderCarrito($usuario->id_usuario);
    }

    // POST /CarritoController/vaciar
    public function vaciar()
    {
        $usuario = Auth::requerir(self::ROLES_COMPRA);
        $this->model->vaciar($usuario->id_usuario);
        $this->responderCarrito($usuario->id_usuario);
    }

    private function responderCarrito($idUsuario, $mensaje = null)
    {
        $this->response->status(200)->toJSON([
            'items' => $this->model->getItems($idUsuario),
            'cupones' => $this->model->getCupones($idUsuario),
        ], $mensaje);
    }
}
