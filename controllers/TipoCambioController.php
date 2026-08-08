<?php

/**
 * Consumo de Web Service
 * obtiene el tipo de cambio del dólar desde el API oficial del
 * Ministerio de Hacienda de Costa Rica y lo cachea 6 horas en un
 */
class TipoCambioController
{
    const URL_SERVICIO = 'https://api.hacienda.go.cr/indicadores/tc/dolar';
    const SEGUNDOS_CACHE = 21600;

    private $response;

    public function __construct()
    {
        $this->response = new Response();
    }

    public function index()
    {
        $cacheFile = $this->rutaCache();

        if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < self::SEGUNDOS_CACHE) {
            $cache = json_decode(file_get_contents($cacheFile));
            if ($cache && !empty($cache->colones_por_dolar)) {
                $this->response->status(200)->toJSON($cache);
                return;
            }
        }

        $datos = $this->consultarServicio();
        if ($datos !== null) {
            @file_put_contents($cacheFile, json_encode($datos));
            $this->response->status(200)->toJSON($datos);
            return;
        }

        if (file_exists($cacheFile)) {
            $cache = json_decode(file_get_contents($cacheFile));
            if ($cache && !empty($cache->colones_por_dolar)) {
                $this->response->status(200)->toJSON($cache);
                return;
            }
        }

        $this->response->status(503)->toJSON(null, 'El servicio de tipo de cambio no está disponible');
    }

    private function consultarServicio()
    {
        $ch = curl_init(self::URL_SERVICIO);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $respuesta = curl_exec($ch);
        $codigo = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($respuesta === false || $codigo !== 200) {
            return null;
        }
        $json = json_decode($respuesta);
        $venta = $json->venta->valor ?? null;
        if (!$venta || floatval($venta) <= 0) {
            return null;
        }
        return [
            'colones_por_dolar' => round(floatval($venta), 2),
            'compra' => isset($json->compra->valor) ? round(floatval($json->compra->valor), 2) : null,
            'fecha' => $json->venta->fecha ?? null,
            'fuente' => 'api.hacienda.go.cr',
            'actualizado_en' => date('Y-m-d H:i:s'),
        ];
    }

    private function rutaCache()
    {
        $dir = Config::get('LOG_PATH');
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        return rtrim($dir, '/') . '/tipo_cambio_cache.json';
    }
}
