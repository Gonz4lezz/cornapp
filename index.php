<?php
// Composer autoloader
require_once 'vendor/autoload.php';
/*Encabezada de las solicitudes*/
/*CORS*/
header("Access-Control-Allow-Origin: * ");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");
header('Content-Type: application/json');

/*--- Requerimientos Clases o librerías*/
require_once "controllers/core/Config.php";
require_once "controllers/core/HandleException.php";
require_once "controllers/core/Logger.php";
require_once "controllers/core/MySqlConnect.php";
require_once "controllers/core/Request.php";
require_once "controllers/core/Response.php";
require_once "controllers/core/Auth.php";

/***--- Agregar todos los modelos*/
require_once "models/ProductoModel.php";
require_once "models/ComboModel.php";
require_once "models/MenuModel.php";
require_once "models/ProcesoPreparacionModel.php";
require_once "models/CategoriaModel.php";
require_once "models/IngredienteModel.php";
require_once "models/EstacionModel.php";
require_once "models/CuponModel.php";
require_once "models/UsuarioModel.php";
require_once "models/CarritoModel.php";
require_once "models/PedidoModel.php";
require_once "models/CocinaModel.php";
require_once "models/DashboardModel.php";

/***--- Agregar todos los controladores*/
require_once "controllers/ProductoController.php";
require_once "controllers/ComboController.php";
require_once "controllers/MenuController.php";
require_once "controllers/ProcesoPreparacionController.php";
require_once "controllers/CategoriaController.php";
require_once "controllers/IngredienteController.php";
require_once "controllers/EstacionController.php";
require_once "controllers/CuponController.php";
require_once "controllers/AuthController.php";
require_once "controllers/CarritoController.php";
require_once "controllers/PedidoController.php";
require_once "controllers/CocinaController.php";
require_once "controllers/TipoCambioController.php";
require_once "controllers/UsuarioController.php";
require_once "controllers/DashboardController.php";


//Enrutador
require_once "routes/RoutesController.php";
$index = new RoutesController();
$index->index();


