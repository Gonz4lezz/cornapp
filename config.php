<?php
return [
    'LOG_PATH' => __DIR__ . '/Log',
    'DB_USERNAME' => 'root',
    'DB_PASSWORD' => '123456',
    'DB_HOST' => 'localhost',
    'DB_DBNAME' => 'cornapp',
    'SECRET_KEY'=>'e0d17975bc9bd57eee132eecb6da6f11048e8a88506cc3bffc7249078cf2a77a',
    'GOOGLE_CLIENT_ID'=>'410757568536-87hbnmk6a7odcp0oaut2a2k2kpq9gtdr.apps.googleusercontent.com',
    'RESTAURANTE_NOMBRE'=>'CornApp Alajuela',
    'RESTAURANTE_LAT'=>10.012001,
    'RESTAURANTE_LNG'=>-84.206440,
    // Velocidad promedio estimada del repartidor, para calcular la duración del envío
    'VELOCIDAD_REPARTO_KMH'=>25,
    // Envío de facturas por correo (PHPMailer sobre el SMTP de Gmail).
    'CORREO_HOST'=>'smtp.gmail.com',
    'CORREO_PUERTO'=>587,
    'CORREO_USUARIO'=>'juerguencalvo@gmail.com',
    'CORREO_CLAVE'=>'vztz qrjb psft pqyl',
    'CORREO_REMITENTE'=>'CornApp'
];