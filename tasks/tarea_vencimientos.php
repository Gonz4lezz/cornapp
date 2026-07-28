<?php

date_default_timezone_set('America/Costa_Rica');

$base = dirname(__DIR__);
require_once $base . '/vendor/autoload.php';
require_once $base . '/controllers/core/Config.php';
require_once $base . '/controllers/core/HandleException.php';
require_once $base . '/controllers/core/Logger.php';
require_once $base . '/controllers/core/MySqlConnect.php';
require_once $base . '/models/MenuModel.php';
require_once $base . '/models/CuponModel.php';

$inicio = date('Y-m-d H:i:s');
$lineas = ["[$inicio] Ejecución de la tarea de vencimientos"];

try {
    $menusVencidos  = (new MenuModel())->desactivarVencidos();
    $cuponesVencidos = (new CuponModel())->desactivarVencidos();

    if (empty($menusVencidos) && empty($cuponesVencidos)) {
        $lineas[] = "  Sin cambios: no hay menús ni cupones vencidos en este momento.";
    } else {
        foreach ($menusVencidos as $m) {
            $lineas[] = "  Menú desactivado:  '{$m->nombre}' (venció el {$m->fecha_fin})";
        }
        foreach ($cuponesVencidos as $c) {
            $lineas[] = "  Cupón desactivado: {$c->codigo} - '{$c->nombre}' (venció el {$c->fecha_fin})";
        }
        $total = count($menusVencidos) + count($cuponesVencidos);
        $lineas[] = "  Total desactivados: $total";
    }
} catch (\Throwable $e) {
    $lineas[] = "  ERROR al ejecutar la tarea: " . $e->getMessage();
}

$logDir = $base . '/tasks/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}
$logFile = $logDir . '/tareas_' . date('Y-m-d') . '.log';
$salida = implode(PHP_EOL, $lineas) . PHP_EOL;
file_put_contents($logFile, $salida, FILE_APPEND);

echo $salida;
