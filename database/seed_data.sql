-- ============================================================
-- CORN APP - Datos de prueba (Seed) para Avance 3
-- Ejecutar DESPUÉS de cornapp_bd.sql
-- ============================================================

USE cornapp;

-- ============================================================
-- DATOS INICIALES
-- ============================================================

INSERT INTO rol (nombre, descripcion) VALUES
    ('Cliente',       'Usuario final que realiza pedidos'),
    ('Encargado',     'Empleado encargado de gestionar pedidos y atención'),
    ('Cocina',        'Usuario del área de cocina, gestiona la preparación'),
    ('Administrador', 'Acceso total al sistema, gestiona usuarios, productos y menús');

INSERT INTO estado_pedido (nombre_estado, descripcion) VALUES
    ('Registrado',     'El pedido fue pagado y registrado, en espera de aceptación del encargado'),   -- 1
    ('Aceptado',       'El encargado aceptó el pedido y fue enviado a cocina'),                        -- 2
    ('En preparación', 'El pedido se encuentra en preparación en cocina'),                             -- 3
    ('Listo',          'Finalizó su preparación y está listo para entregar o recoger'),                -- 4
    ('En camino',      'El pedido salió del local hacia la dirección del cliente'),                    -- 5
    ('Entregado',      'Ha sido entregado al cliente');                                                -- 6

INSERT INTO metodo_pago (nombre) VALUES
    ('Tarjeta de crédito'),
    ('Tarjeta de débito'),
    ('Efectivo');

INSERT INTO categoria (nombre, descripcion, orden_display) VALUES
    ('Corn Dogs',       'Variedad de corn dogs coreanos',         1),
    ('Acompañamientos', 'Papas, sopas y complementos',            2),
    ('Bebidas',         'Bebidas frías y calientes',              3),
    ('Combos',          'Combinaciones especiales con descuento', 4);

INSERT INTO estacion_cocina (nombre, descripcion, color_estacion) VALUES
    ('Preparación', 'Armado y preparación inicial del producto', '#F59E0B'),
    ('Fritura',     'Cocción en aceite caliente',                '#EF4444'),
    ('Emplatado',   'Montaje final y presentación del producto', '#10B981');

INSERT INTO tarifa_envio (nombre, tarifa_base, precio_por_km, distancia_maxima_km) VALUES
    ('Zona cercana',  500.00,  200.00, 5.00),
    ('Zona media',    800.00,  250.00, 15.00),
    ('Zona lejana',  1200.00,  300.00, 30.00);

-- ============================================================
-- USUARIOS DE PRUEBA (uno por rol + un segundo cliente)
-- Contraseñas: Cliente123 / Encargado123 / Cocina123 / Admin123
-- (María usa Cliente123, igual que Carlos)
-- ============================================================

INSERT INTO usuario (id_rol, nombre, apellido, correo, telefono, contrasena_hash) VALUES
    (1, 'Carlos', 'Jiménez Vargas',  'cliente@cornapp.com',       '8888-1111', '$2y$12$FHH/XvkAPmiCaE2ARSbAruPJ/JD65UU.a53HnhD63eIdLjj4aZDE.'),  -- 1
    (1, 'María',  'Rodríguez Soto',  'maria.cliente@cornapp.com', '8888-2222', '$2y$12$FHH/XvkAPmiCaE2ARSbAruPJ/JD65UU.a53HnhD63eIdLjj4aZDE.'),  -- 2
    (2, 'Laura',  'Fernández Mora',  'encargado@cornapp.com',     '8888-3333', '$2y$12$D.YVqpcklt.ivAcb/0rla.GvIMnT5Go.IGRKIk.mXn0tqrs60RSlS'),  -- 3
    (3, 'Diego',  'Chaves Rojas',    'cocina@cornapp.com',        '8888-4444', '$2y$12$Immhh6l6FYIJ2J7JvJxJEe27UCCPlIq93n/mKJgm.jvZjJbiY6Q46'),  -- 4
    (4, 'Ana',    'Castro Blanco',   'admin@cornapp.com',         '8888-5555', '$2y$12$ziPutf5z22CVCkz4RXOoh.MnpkuRLAdGsWGag1KL0kOoc/YWgIDlW');  -- 5


-- ============================================================
-- INGREDIENTES
-- ============================================================

INSERT INTO ingrediente (nombre, descripcion, precio_extra, es_alergeno) VALUES
    ('Masa de maíz',         'Masa de maíz dulce estilo coreano',                    NULL,    FALSE),  -- 1
    ('Salchicha americana',  'Salchicha tipo hot dog premium',                        NULL,    FALSE),  -- 2
    ('Queso mozzarella',     'Queso mozzarella derretido',                            500.00,  TRUE),   -- 3
    ('Azúcar',               'Azúcar blanca para cobertura',                          NULL,    FALSE),  -- 4
    ('Aceite vegetal',       'Aceite para fritura profunda',                          NULL,    FALSE),  -- 5
    ('Ketchup',              'Salsa de tomate',                                       NULL,    FALSE),  -- 6
    ('Mostaza',              'Mostaza amarilla americana',                            NULL,    FALSE),  -- 7
    ('Papas',                'Papas cortadas estilo french fries',                    NULL,    FALSE),  -- 8
    ('Sal',                  'Sal de mesa',                                           NULL,    FALSE),  -- 9
    ('Chocolate',            'Chocolate derretido para cobertura',                    300.00,  TRUE),   -- 10
    ('Maple syrup',          'Jarabe de maple canadiense',                            400.00,  FALSE),  -- 11
    ('Cheddar',              'Queso cheddar rallado',                                 500.00,  TRUE),   -- 12
    ('Tocino',               'Tocino crujiente desmenuzado',                          600.00,  FALSE),  -- 13
    ('Jalapeño',             'Chile jalapeño en rodajas',                             200.00,  FALSE),  -- 14
    ('Leche',                'Leche entera para batidos',                             NULL,    TRUE),   -- 15
    ('Helado de vainilla',   'Helado artesanal de vainilla',                          NULL,    TRUE),   -- 16
    ('Café',                 'Café molido premium',                                   NULL,    FALSE),  -- 17
    ('Panko',                'Pan rallado japonés para cobertura crujiente',          NULL,    TRUE),   -- 18
    ('Salchicha coreana',    'Salchicha estilo coreano con especias',                 NULL,    FALSE),  -- 19
    ('Miel',                 'Miel de abeja natural',                                 300.00,  FALSE),  -- 20
    ('Tomate',               'Tomate fresco maduro para sopas y salsas',              NULL,    FALSE),  -- 21
    ('Brócoli',              'Brócoli fresco en floretes',                            NULL,    FALSE),  -- 22
    ('Crema de leche',       'Crema de leche para sopas y cremosos',                  NULL,    TRUE),   -- 23
    ('Cebolla',              'Cebolla blanca picada',                                 NULL,    FALSE),  -- 24
    ('Crema agria',          'Crema agria estilo americano',                          200.00,  TRUE),   -- 25
    ('Cebollín',             'Cebollín verde picado',                                 NULL,    FALSE),  -- 26
    ('Limón',                'Limón mesino fresco',                                   NULL,    FALSE),  -- 27
    ('Té negro',             'Hojas de té negro premium',                             NULL,    FALSE),  -- 28
    ('Bebida gaseosa',       'Bebida gaseosa carbonatada',                            NULL,    FALSE),  -- 29
    ('Pan tostado',          'Tostadas crujientes para acompañar sopas',              NULL,    TRUE),   -- 30
    ('Pollo',                'Trocitos de pollo desmenuzado',                         500.00,  FALSE),  -- 31
    ('Carne desmechada',     'Carne de res desmechada y sazonada',                    600.00,  FALSE),  -- 32
    ('Queso Turrialba',      'Queso turrialba fresco costarricense',                  400.00,  TRUE),   -- 33
    ('Hielo',                'Hielo en cubos',                                        NULL,    FALSE),  -- 34
    ('Menta',                'Hojas frescas de menta',                                NULL,    FALSE),  -- 35
    ('Agua',                 'Agua purificada',                                       NULL,    FALSE);  -- 36

-- ============================================================
-- PRODUCTOS
-- ============================================================

-- Categoría 1: Corn Dogs (ids 1-6)
INSERT INTO producto (id_categoria, nombre, descripcion, precio_base, tiempo_preparacion, disponible) VALUES
    (1, 'Corn Dog Clásico',        'El auténtico corn dog coreano con salchicha americana envuelta en masa de maíz dulce, frito hasta dorar.',                      2500.00, 8,  TRUE),
    (1, 'Corn Dog de Queso',       'Corn dog relleno de queso mozzarella derretido que se estira con cada mordida. Cubierto con azúcar.',                            3000.00, 10, TRUE),
    (1, 'Corn Dog Mixto',          'Lo mejor de ambos mundos: mitad salchicha, mitad queso mozzarella. El favorito de la casa.',                                     3200.00, 10, TRUE),
    (1, 'Corn Dog de Chocolate',   'Corn dog cubierto con chocolate derretido y chispas de colores. Perfecto para los amantes del dulce.',                           3500.00, 12, TRUE),
    (1, 'Corn Dog Cheddar Bacon',  'Corn dog con queso cheddar y trocitos de tocino crujiente en la masa. Sabor intenso y adictivo.',                                3800.00, 12, TRUE),
    (1, 'Corn Dog Picante',        'Corn dog con jalapeños en la masa y salsa picante. Para los valientes del sabor.',                                               3000.00, 10, TRUE);

-- Categoría 2: Acompañamientos (ids 7-13)
INSERT INTO producto (id_categoria, nombre, descripcion, precio_base, tiempo_preparacion, disponible) VALUES
    (2, 'Papas Fritas Clásicas',              'Papas fritas doradas y crujientes con sal marina. El acompañamiento perfecto.',                                     1500.00, 6,  TRUE),
    (2, 'Papas con Cheddar',                  'Papas fritas bañadas en salsa de queso cheddar fundido y tocino crujiente.',                                        2200.00, 8,  TRUE),
    (2, 'Aros de Cebolla',                    'Aros de cebolla empanizados con panko japonés, fritos hasta quedar crujientes.',                                    1800.00, 7,  TRUE),
    (2, 'Papas Fritas Con Queso Derretido',   'Papas fritas crujientes cubiertas con queso cheddar derretido cremoso.',                                            2000.00, 7,  TRUE),
    (2, 'Sopa De Tomate',                     'Sopa cremosa de tomate maduro asado, con un toque de crema y especias.',                                            1900.00, 10, TRUE),
    (2, 'Sopa De Brócoli',                    'Crema de brócoli fresco con queso cheddar derretido. Suave y reconfortante.',                                       2100.00, 10, TRUE),
    (2, 'Papas Supremas',                     'Papas fritas cargadas con cheddar, tocino, crema agria y cebollín. Versión estilo americano.',                      2800.00, 9,  TRUE);

-- Categoría 3: Bebidas (ids 14-17)
INSERT INTO producto (id_categoria, nombre, descripcion, precio_base, tiempo_preparacion, disponible) VALUES
    (3, 'Limonada Natural',        'Limonada fresca preparada al momento con limones naturales y un toque de menta.',                                                1200.00, 3,  TRUE),
    (3, 'Milkshake de Vainilla',   'Batido cremoso de helado de vainilla artesanal con leche fresca.',                                                               2000.00, 5,  TRUE),
    (3, 'Gaseosa',                'Bebida gaseosa fría servida con hielo. Disponible en sabores variados.',                                                          900.00, 2,  TRUE),
    (3, 'Té Frío',                 'Té negro frío endulzado, servido con hielo y rodaja de limón. Refrescante y natural.',                                          1100.00, 3,  TRUE);

-- ============================================================
-- PRODUCTO_INGREDIENTE
-- ============================================================

-- Corn Dog Clásico (1) — masa + salchicha americana, frito, espolvoreado de azúcar
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (1, 1, TRUE),   -- Masa de maíz
    (1, 2, TRUE),   -- Salchicha americana
    (1, 5, FALSE),  -- Aceite vegetal
    (1, 4, FALSE),  -- Azúcar
    (1, 9, FALSE),  -- Sal
    (1, 6, FALSE),  -- Ketchup
    (1, 7, FALSE);  -- Mostaza

-- Corn Dog de Queso (2) — relleno de mozzarella derretido
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (2, 1, TRUE),   -- Masa de maíz
    (2, 3, TRUE),   -- Queso mozzarella
    (2, 5, FALSE),  -- Aceite vegetal
    (2, 4, FALSE);  -- Azúcar

-- Corn Dog Mixto (3) — mitad salchicha, mitad mozzarella
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (3, 1, TRUE),   -- Masa de maíz
    (3, 2, TRUE),   -- Salchicha americana
    (3, 3, TRUE),   -- Queso mozzarella
    (3, 5, FALSE),  -- Aceite vegetal
    (3, 4, FALSE),  -- Azúcar
    (3, 6, FALSE),  -- Ketchup
    (3, 7, FALSE);  -- Mostaza

-- Corn Dog de Chocolate (4) — bañado en chocolate
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (4, 1, TRUE),   -- Masa de maíz
    (4, 2, TRUE),   -- Salchicha americana
    (4, 10, TRUE),  -- Chocolate
    (4, 5, FALSE),  -- Aceite vegetal
    (4, 4, FALSE);  -- Azúcar

-- Corn Dog Cheddar Bacon (5) — cheddar y tocino en la masa
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (5, 1, TRUE),   -- Masa de maíz
    (5, 2, TRUE),   -- Salchicha americana
    (5, 12, TRUE),  -- Cheddar
    (5, 13, TRUE),  -- Tocino
    (5, 5, FALSE),  -- Aceite vegetal
    (5, 9, FALSE);  -- Sal

-- Corn Dog Picante (6) — salchicha coreana con jalapeños
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (6, 1, TRUE),   -- Masa de maíz
    (6, 19, TRUE),  -- Salchicha coreana
    (6, 14, TRUE),  -- Jalapeño
    (6, 5, FALSE),  -- Aceite vegetal
    (6, 9, FALSE);  -- Sal

-- Papas Fritas Clásicas (7) — papas + sal
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (7, 8, TRUE),   -- Papas
    (7, 9, FALSE),  -- Sal
    (7, 5, FALSE);  -- Aceite vegetal

-- Papas con Cheddar (8) — papas con salsa de cheddar y tocino
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (8, 8, TRUE),   -- Papas
    (8, 12, TRUE),  -- Cheddar
    (8, 13, FALSE), -- Tocino
    (8, 5, FALSE),  -- Aceite vegetal
    (8, 9, FALSE);  -- Sal

-- Aros de Cebolla (9) — cebolla empanizada con panko
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (9, 24, TRUE),  -- Cebolla
    (9, 18, TRUE),  -- Panko
    (9, 5, FALSE),  -- Aceite vegetal
    (9, 9, FALSE);  -- Sal

-- Papas Fritas Con Queso Derretido (10) — papas con cheddar derretido
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (10, 8, TRUE),   -- Papas
    (10, 12, TRUE),  -- Cheddar
    (10, 5, FALSE),  -- Aceite vegetal
    (10, 9, FALSE);  -- Sal

-- Sopa De Tomate (11) — tomate, crema, cebolla, acompañada con pan
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (11, 21, TRUE),  -- Tomate
    (11, 23, TRUE),  -- Crema de leche
    (11, 24, FALSE), -- Cebolla
    (11, 9, FALSE),  -- Sal
    (11, 30, FALSE); -- Pan tostado

-- Sopa De Brócoli (12) — brócoli, crema, queso turrialba
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (12, 22, TRUE),  -- Brócoli
    (12, 23, TRUE),  -- Crema de leche
    (12, 33, TRUE),  -- Queso turrialba
    (12, 24, FALSE), -- Cebolla
    (12, 9, FALSE);  -- Sal

-- Papas Supremas (13) — papas cargadas con quesos, proteína y toppings
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (13, 8, TRUE),   -- Papas
    (13, 3, TRUE),   -- Queso mozzarella
    (13, 12, TRUE),  -- Cheddar
    (13, 31, TRUE),  -- Pollo
    (13, 32, TRUE),  -- Carne desmechada
    (13, 13, FALSE), -- Tocino
    (13, 26, FALSE), -- Cebollín
    (13, 25, FALSE), -- Crema agria
    (13, 5, FALSE),  -- Aceite vegetal
    (13, 9, FALSE);  -- Sal

-- Limonada Natural (14) — limones frescos con menta
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (14, 27, TRUE),  -- Limón
    (14, 36, TRUE),  -- Agua
    (14, 4, FALSE),  -- Azúcar
    (14, 34, FALSE), -- Hielo
    (14, 35, FALSE); -- Menta

-- Milkshake de Vainilla (15) — helado + leche
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (15, 16, TRUE),  -- Helado de vainilla
    (15, 15, TRUE),  -- Leche
    (15, 4, FALSE);  -- Azúcar

-- Refresco (16) — gaseosa servida con hielo
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (16, 29, TRUE),  -- Bebida gaseosa
    (16, 34, FALSE); -- Hielo

-- Té Frío (17) — té negro endulzado con limón
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (17, 28, TRUE),  -- Té negro
    (17, 36, TRUE),  -- Agua
    (17, 4, FALSE),  -- Azúcar
    (17, 27, FALSE), -- Limón
    (17, 34, FALSE); -- Hielo

-- ============================================================
-- IMÁGENES DE PRODUCTOS
-- ============================================================

INSERT INTO imagen_producto (id_producto, url_imagen, texto_alt, es_principal, orden_display) VALUES
    (1,  '/assets/corndog_clasico.jpg', 'Corn Dog Clásico',       TRUE,  1),
    (2,  '/assets/corndog_queso.jpg', 'Corn Dog de Queso',      TRUE,  1),
    (3,  '/assets/corndog_mixto.jpg', 'Corn Dog Mixto',         TRUE,  1),
    (4,  '/assets/corndog_chocolate.jpg', 'Corn Dog de Chocolate',  TRUE,  1),
    (5,  '/assets/corndog_bacon_queso.jpg', 'Corn Dog Cheddar Bacon', TRUE,  1),
    (6,  '/assets/corndog_picante.jpg', 'Corn Dog Picante',       TRUE,  1),
    (7,  '/assets/papas_fritas.jpg', 'Papas Fritas Clásicas',  TRUE,  1),
    (8,  '/assets/papas_fritas_cheddar.jpg', 'Papas con Cheddar',      TRUE,  1),
    (9,  '/assets/aros_de_cebolla.jpg', 'Aros de Cebolla',        TRUE,  1),
    (10, '/assets/papas_con_queso_derretido.jpg',    'Papas Fritas Con Queso Derretido',       TRUE,  1),
    (11, '/assets/sopa_de_tomate.jpg', 'Sopa De Tomate',       TRUE,  1),
    (12, '/assets/sopa_de_brocoli.jpg', 'Sopa De Brócoli',  TRUE,  1),
    (13, '/assets/papas_supremas.jpg', 'Papas Supremas',         TRUE,  1),
    (14, '/assets/limonada.jpg',    'Limonada Natural',   TRUE,  1),
	(15, '/assets/milkshake_vainilla.jpg',    'Milkshake de Vainilla',   TRUE,  1),
	(16, '/assets/refresco_generico.jpg', 'Gaseosa',         TRUE,  1),
    (17, '/assets/te_frio.jpg',    'Té Frio',   TRUE,  1);

-- ============================================================
-- COMBOS
-- ============================================================

INSERT INTO combo (id_categoria, nombre, descripcion, precio_combo) VALUES
    (4, 'Combo Clásico',         'Un Corn Dog Clásico + Papas Fritas + Limonada Natural. El combo ideal para probar nuestro producto estrella.',               4500.00),
    (4, 'Combo Queso Lovers',    'Un Corn Dog de Queso + Papas con Cheddar + Milkshake de Vainilla. Para los amantes del queso.',                               6500.00),
    (4, 'Combo Familiar',        'Dos Corn Dogs Mixtos + Papas Supremas + Dos Refrescos. Perfecto para compartir en familia.',                                  9000.00),
    (4, 'Combo Snack',           'Aros de Cebolla + Té Frío. Un snack rápido y delicioso.',                                                                     2500.00);

-- Combo Clásico (3 productos)
INSERT INTO combo_producto (id_combo, id_producto, cantidad) VALUES
    (1, 1, 1),    -- Corn Dog Clásico
    (1, 7, 1),    -- Papas Fritas Clásicas
    (1, 14, 1);   -- Limonada Natural

-- Combo Queso Lovers (3 productos)
INSERT INTO combo_producto (id_combo, id_producto, cantidad) VALUES
    (2, 2, 1),    -- Corn Dog de Queso
    (2, 8, 1),    -- Papas con Cheddar
    (2, 15, 1);   -- Milkshake de Vainilla

-- Combo Familiar (3 productos)
INSERT INTO combo_producto (id_combo, id_producto, cantidad) VALUES
    (3, 3, 2),    -- 2x Corn Dog Mixto
    (3, 13, 1),   -- Papas Supremas
    (3, 16, 2);   -- 2x Refresco

-- Combo Snack (2 productos)
INSERT INTO combo_producto (id_combo, id_producto, cantidad) VALUES
    (4, 9, 1),    -- Aros de Cebolla
    (4, 17, 1);   -- Té Frío

-- Imágenes de combos
INSERT INTO imagen_combo (id_combo, url_imagen, texto_alt, es_principal) VALUES
    (1, '/assets/corndog_bacon_queso.jpg', 'Combo Clásico',       TRUE),
    (2, '/assets/corndog_queso.jpg', 'Combo Queso Lovers',  TRUE),
    (3, '/assets/combo_familiar.jpg', 'Combo Familiar',      TRUE),
    (4, '/assets/aros_de_cebolla.jpg', 'Combo Snack',         TRUE);

-- ============================================================
-- MENÚS
-- ============================================================

-- Menús 1-3 por DÍAS de la semana; menú 4 por RANGO de fechas.
INSERT INTO menu (nombre, descripcion, tipo_disponibilidad, fecha_inicio, fecha_fin, hora_inicio, hora_fin, esta_activo) VALUES
    ('Menú del Día',          'Nuestro menú principal disponible de lunes a sábado.',                         'dias',   NULL,         NULL,         '10:00:00', '21:00:00', TRUE),
    ('Menú de Fin de Semana', 'Menú especial con combos exclusivos para sábados y domingos.',                 'dias',   NULL,         NULL,         '11:00:00', '22:00:00', TRUE),
    ('Menú Desayuno',         'Menú ideal para comenzar tu día con energía, de lunes a viernes de 8am a 10am.', 'dias',   NULL,         NULL,         '08:00:00', '10:00:00', TRUE),
    ('Menú Feria del Maíz',   'Menú temático de la Feria del Maíz de julio, disponible por tiempo limitado.', 'fechas', '2026-07-01', '2026-07-31', '10:00:00', '22:00:00', TRUE);

-- Días de disponibilidad (0=Domingo ... 6=Sábado)
-- Menú del Día: lunes a sábado
INSERT INTO menu_dia (id_menu, dia_semana) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6);

-- Menú de Fin de Semana: sábado y domingo
INSERT INTO menu_dia (id_menu, dia_semana) VALUES
    (2, 6), (2, 0);

-- Menú Desayuno: lunes a viernes
INSERT INTO menu_dia (id_menu, dia_semana) VALUES
    (3, 1), (3, 2), (3, 3), (3, 4), (3, 5);


-- Productos en Menú del Día
INSERT INTO menu_producto (id_menu, id_producto, orden_display) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 5, 4), (1, 6, 5),                       
    (1, 7, 1), (1, 8, 2), (1, 9, 3), (1, 10, 4), (1, 11, 5), (1, 12, 6), (1, 13, 7),
    (1, 14, 1), (1, 15, 2), (1, 16, 3), (1, 17, 4);                                

INSERT INTO menu_combo (id_menu, id_combo, orden_display) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3);

-- Productos en Menú Fin de Semana (todos)
INSERT INTO menu_producto (id_menu, id_producto, orden_display) VALUES
    (2, 1, 1), (2, 2, 2), (2, 3, 3), (2, 4, 4), (2, 5, 5), (2, 6, 6),
    (2, 7, 1), (2, 8, 2), (2, 9, 3), (2, 10, 4), (2, 11, 5), (2, 12, 6), (2, 13, 7),
    (2, 14, 1), (2, 15, 2), (2, 16, 3), (2, 17, 4);

INSERT INTO menu_combo (id_menu, id_combo, orden_display) VALUES
    (2, 1, 1), (2, 2, 2), (2, 3, 3), (2, 4, 4);

-- Productos Menú Desayuno
INSERT INTO menu_producto (id_menu, id_producto, orden_display) VALUES
    (3, 7, 1), (3, 9, 2), (3, 10, 3),
    (3, 14, 1), (3, 15, 2), (3, 16, 3), (3, 17, 4);

INSERT INTO menu_combo (id_menu, id_combo, orden_display) VALUES
    (3, 4, 1);

-- Productos Menú Feria del Maíz (menú 4)
INSERT INTO menu_producto (id_menu, id_producto, orden_display) VALUES
    (4, 1, 1), (4, 2, 2), (4, 3, 3), (4, 4, 4), (4, 5, 5), (4, 6, 6),
    (4, 7, 1), (4, 8, 2), (4, 10, 3), (4, 13, 4),
    (4, 14, 1), (4, 15, 2), (4, 17, 3);

INSERT INTO menu_combo (id_menu, id_combo, orden_display) VALUES
    (4, 1, 1), (4, 2, 2), (4, 3, 3), (4, 4, 4);

-- ===========================================================
-- PROCESOS DE PREPARACIÓN (ejemplos con 1, 2 y 3 estaciones)
-- ============================================================

-- Proceso 1: Corn Dog Clásico (producto 1) — 3 estaciones
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (1, 8);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (1, 1, 1, 3, 'Insertar el palito en la salchicha, cubrir uniformemente con la masa de maíz dulce.'),
    (1, 2, 2, 3, 'Freír en aceite a 180°C durante 3 minutos hasta que esté dorado uniforme.'),
    (1, 3, 3, 2, 'Escurrir el exceso de aceite, espolvorear azúcar y servir con salsas.');

-- Proceso 2: Corn Dog de Queso (producto 2) — 3 estaciones
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (2, 10);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (2, 1, 1, 4, 'Insertar el palito en el bloque de mozzarella, cubrir con masa de maíz asegurando cobertura completa.'),
    (2, 2, 2, 4, 'Freír en aceite a 175°C durante 4 minutos. Temperatura más baja para que el queso se derrita sin quemar la masa.'),
    (2, 3, 3, 2, 'Escurrir, cortar la punta para mostrar el queso derretido, espolvorear azúcar.');

-- Proceso 3: Corn Dog Mixto (producto 3) — 3 estaciones
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (3, 10);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (3, 1, 1, 4, 'Ensartar mitad salchicha y mitad mozzarella en el palito, cubrir con masa de maíz.'),
    (3, 2, 2, 4, 'Freír en aceite a 177°C durante 4 minutos hasta dorar uniformemente.'),
    (3, 3, 3, 2, 'Escurrir, espolvorear azúcar, servir con ketchup y mostaza.');

-- Proceso 4: Corn Dog de Chocolate (producto 4) — 3 estaciones
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (4, 12);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (4, 1, 1, 3, 'Insertar palito en la salchicha, cubrir con masa de maíz.'),
    (4, 2, 2, 4, 'Freír en aceite a 180°C durante 3-4 minutos.'),
    (4, 3, 3, 5, 'Bañar con chocolate derretido templado, agregar chispas de colores, dejar enfriar 1 minuto.');

-- Proceso 5: Papas Fritas Clásicas (producto 7) — 2 estaciones
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (7, 6);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (5, 1, 1, 2, 'Cortar las papas en bastones uniformes, secar con papel absorbente.'),
    (5, 2, 2, 4, 'Freír a 190°C durante 4 minutos hasta quedar doradas y crujientes. Sazonar con sal.');

-- Proceso 6: Aros de Cebolla (producto 9) — 2 estaciones
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (9, 7);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (6, 1, 1, 3, 'Cortar cebollas en aros gruesos, pasar por harina y luego por panko japonés.'),
    (6, 2, 2, 4, 'Freír a 185°C durante 3-4 minutos hasta quedar dorados y crujientes.');

-- Proceso 7: Papas Fritas Con Queso Derretido (producto 10) — 3 estaciones
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (10, 7);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (7, 1, 1, 2, 'Cortar y secar las papas, preparar el queso cheddar rallado.'),
    (7, 2, 2, 4, 'Freír las papas a 190°C hasta quedar doradas.'),
    (7, 3, 3, 1, 'Cubrir las papas con queso cheddar derretido y servir caliente.');

-- Proceso 8: Sopa De Tomate (producto 11) — 2 estaciones
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (11, 10);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (8, 1, 1, 8, 'Sofreír cebolla, agregar tomate maduro y cocinar a fuego medio. Licuar y agregar crema.'),
    (8, 3, 2, 2, 'Servir en plato hondo, decorar con un hilo de crema y hojas de albahaca.');

-- Proceso 9: Sopa De Brócoli (producto 12) — 2 estaciones
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (12, 10);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (9, 1, 1, 8, 'Cocer el brócoli, licuar con crema y caldo. Incorporar queso cheddar hasta derretir.'),
    (9, 3, 2, 2, 'Servir en plato hondo, decorar con cheddar rallado por encima.');

-- Proceso 10: Papas Supremas (producto 13) — 3 estaciones
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (13, 9);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (10, 1, 1, 3, 'Preparar las papas y picar el tocino y cebollín.'),
    (10, 2, 2, 4, 'Freír las papas hasta dorar. Cocinar el tocino crujiente.'),
    (10, 3, 3, 2, 'Montar las papas con cheddar derretido, tocino, crema agria y cebollín por encima.');

-- Proceso 11: Limonada Natural (producto 14) — 1 estación
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (14, 3);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (11, 1, 1, 3, 'Exprimir limones frescos, mezclar con agua, azúcar y hielo. Decorar con rodaja de limón y menta.');

-- Proceso 12: Milkshake de Vainilla (producto 15) — 1 estación
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (15, 5);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (12, 1, 1, 5, 'Licuar helado de vainilla con leche fría, servir en vaso alto con crema batida y cereza.');

-- Proceso 13: Refresco (producto 16) — 1 estación
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (16, 2);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (13, 1, 1, 2, 'Servir bebida gaseosa fría en vaso con hielo.');

-- Proceso 14: Té Frío (producto 17) — 1 estación
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (17, 3);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (14, 1, 1, 3, 'Preparar infusión de té negro, enfriar, endulzar con azúcar y servir con hielo y rodaja de limón.');

-- ============================================================
-- CUPONES DE DESCUENTO (funcionalidad extra del equipo)
-- Cada cupón aplica a un producto o a un combo. Solo descuentos
-- por porcentaje o monto fijo. Vigencia durante julio 2026.
-- ============================================================

-- Cupones sobre productos
INSERT INTO cupon (codigo, nombre, descripcion, tipo_descuento, valor_descuento, id_producto, id_combo, fecha_inicio, fecha_fin, esta_activo) VALUES
    ('CLASICO15',  '15% en Corn Dog Clásico',     'Llevá nuestro corn dog estrella con 15% de descuento durante toda la temporada.', 'porcentaje', 15.00, 1,  NULL, '2026-07-01 00:00:00', '2026-12-31 23:59:59', TRUE),
    ('QUESO500',   '₡500 en Corn Dog de Queso',   'Descontá ₡500 en el favorito relleno de mozzarella derretido.',                   'monto_fijo', 500.00, 2,  NULL, '2026-07-01 00:00:00', '2026-12-31 23:59:59', TRUE),
    ('CHOCO20',    '20% en Corn Dog de Chocolate','Endulzá tu día con 20% de descuento en el corn dog de chocolate.',               'porcentaje', 20.00, 4,  NULL, '2026-07-01 00:00:00', '2026-12-31 23:59:59', TRUE),
    ('PAPAS300',   '₡300 en Papas Supremas',      'Las papas más cargadas de la casa con ₡300 menos.',                              'monto_fijo', 300.00, 13, NULL, '2026-07-01 00:00:00', '2026-12-31 23:59:59', TRUE),
    ('LIMON10',    '10% en Limonada Natural',     'Refrescate con 10% de descuento en la limonada preparada al momento.',           'porcentaje', 10.00, 14, NULL, '2026-07-01 00:00:00', '2026-12-31 23:59:59', TRUE);

-- Cupones sobre combos
INSERT INTO cupon (codigo, nombre, descripcion, tipo_descuento, valor_descuento, id_producto, id_combo, fecha_inicio, fecha_fin, esta_activo) VALUES
    ('COMBO1000',  '₡1000 en Combo Familiar',     'El combo para compartir con ₡1000 de descuento directo.',                        'monto_fijo', 1000.00, NULL, 3, '2026-07-01 00:00:00', '2026-12-31 23:59:59', TRUE),
    ('QUESOLOVERS','25% en Combo Queso Lovers',   'Los amantes del queso se llevan un 25% de descuento en su combo.',               'porcentaje', 25.00,   NULL, 2, '2026-07-01 00:00:00', '2026-12-31 23:59:59', TRUE);

-- ============================================================
-- PEDIDOS PRECARGADOS (Avance 5)
-- 5 pedidos con variedad de estados, fechas, métodos de pago y
-- entrega, para probar historial, filtros, detalle y cocina.
-- Las fechas son relativas a NOW() para que siempre haya datos
-- recientes al reimportar. Los precios ya incluyen el IVA del 13%:
-- subtotal = base gravable, monto_impuesto = IVA desglosado y
-- monto_total = subtotal + IVA + envío.
-- ============================================================

-- ------------------------------------------------------------
-- Pedido 1 (PED-2026-0001) — Carlos, recogida, tarjeta de crédito, ENTREGADO (hace 9 días)
-- 2x Corn Dog Clásico (₡2500) + 1x Limonada Natural (₡1200)
-- Los precios ya incluyen IVA: cobrado 6200, IVA desglosado 713.27, base 5486.73
-- ------------------------------------------------------------
INSERT INTO pedido (id_cliente, id_empleado, id_estado, numero_pedido, tipo_entrega, subtotal, tasa_impuesto, monto_impuesto, costo_envio, monto_descuento, monto_total, creado_en) VALUES
    (1, NULL, 6, 'PED-2026-0001', 'recogida', 5486.73, 0.1300, 713.27, 0.00, 0.00, 6200.00, DATE_SUB(NOW(), INTERVAL 9 DAY));

INSERT INTO detalle_pedido (id_pedido, id_producto, id_combo, cantidad, precio_unitario, precio_total, monto_descuento, observaciones) VALUES
    (1, 1,  NULL, 2, 2500.00, 5000.00, 0.00, 'Con bastante ketchup y mostaza'),      -- detalle 1
    (1, 14, NULL, 1, 1200.00, 1200.00, 0.00, NULL);                                   -- detalle 2

INSERT INTO pago (id_pedido, id_metodo, monto, estado_pago, id_transaccion, ultimos_cuatro, titular_tarjeta, vencimiento_tarjeta, procesado_en) VALUES
    (1, 1, 6200.00, 'completado', 'TXN-SIM-0001', '4242', 'Carlos Jiménez Vargas', '08/2027', DATE_SUB(NOW(), INTERVAL 9 DAY));

INSERT INTO seguimiento_pedido (id_pedido, id_estado, cambiado_por_usuario_id, comentario, cambiado_en) VALUES
    (1, 1, 1,    'Pedido registrado y pagado por el cliente',    DATE_SUB(NOW(), INTERVAL '9 0:00' DAY_MINUTE)),
    (1, 2, 3,    'Pedido aceptado y enviado a cocina',           DATE_SUB(NOW(), INTERVAL '8 23:55' DAY_MINUTE)),
    (1, 3, 4,    'Cocina inició la preparación',                 DATE_SUB(NOW(), INTERVAL '8 23:50' DAY_MINUTE)),
    (1, 4, 4,    'Preparación finalizada, listo para recoger',   DATE_SUB(NOW(), INTERVAL '8 23:40' DAY_MINUTE)),
    (1, 6, 3,    'Pedido entregado al cliente',                  DATE_SUB(NOW(), INTERVAL '8 23:30' DAY_MINUTE));

INSERT INTO orden_cocina (id_pedido, estado, iniciado_en, completado_en, creado_en) VALUES
    (1, 'completado', DATE_SUB(NOW(), INTERVAL '8 23:50' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '8 23:40' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '8 23:55' DAY_MINUTE));  -- orden 1

INSERT INTO item_orden_cocina (id_orden_cocina, id_detalle, id_producto, cantidad, id_estacion_actual, estado, completado_por_usuario_id, iniciado_en, completado_en) VALUES
    (1, 1, 1,  2, 3, 'completado', 4, DATE_SUB(NOW(), INTERVAL '8 23:50' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '8 23:42' DAY_MINUTE)),
    (1, 2, 14, 1, 1, 'completado', 4, DATE_SUB(NOW(), INTERVAL '8 23:50' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '8 23:45' DAY_MINUTE));

-- ------------------------------------------------------------
-- Pedido 2 (PED-2026-0002) — María, A DOMICILIO, efectivo, ENTREGADO (hace 5 días)
-- 1x Combo Familiar (₡9000) + 2x Gaseosa (₡900)
-- Cobrado 10800 (IVA incluido 1242.48, base 9557.52) + envío 882 (Zona cercana:
-- 500 de base + 200 por km x 1,91 km). Total 11682.00 — efectivo 15000, vuelto 3318.00
-- ------------------------------------------------------------
INSERT INTO pedido (id_cliente, id_empleado, id_estado, numero_pedido, tipo_entrega, subtotal, tasa_impuesto, monto_impuesto, costo_envio, monto_descuento, monto_total, creado_en) VALUES
    (2, NULL, 6, 'PED-2026-0002', 'domicilio', 9557.52, 0.1300, 1242.48, 882.00, 0.00, 11682.00, DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO detalle_pedido (id_pedido, id_producto, id_combo, cantidad, precio_unitario, precio_total, monto_descuento, observaciones) VALUES
    (2, NULL, 3, 1, 9000.00, 9000.00, 0.00, 'Los corn dogs bien dorados por favor'),  -- detalle 3
    (2, 16, NULL, 2, 900.00, 1800.00, 0.00, NULL);                                    -- detalle 4

INSERT INTO pago (id_pedido, id_metodo, monto, estado_pago, id_transaccion, efectivo_recibido, vuelto, procesado_en) VALUES
    (2, 3, 11682.00, 'completado', 'TXN-SIM-0002', 15000.00, 3318.00, DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO envio (id_pedido, id_tarifa, costo_envio, distancia_km, duracion_estimada_min,
                   direccion_texto, latitud, longitud, referencia, nombre_receptor, telefono_receptor,
                   tstamp_salida, tstamp_entrega) VALUES
    (2, 1, 882.00, 1.91, 5,
     'Alajuela centro, del parque Juan Santamaría 200 m norte y 50 m este, casa blanca de dos plantas',
     10.02900000, -84.20000000, 'Portón negro, timbre a la derecha', 'María Rodríguez Soto', '8888-2222',
     DATE_SUB(NOW(), INTERVAL '4 23:10' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '4 22:55' DAY_MINUTE));

INSERT INTO seguimiento_pedido (id_pedido, id_estado, cambiado_por_usuario_id, comentario, cambiado_en) VALUES
    (2, 1, 2, 'Pedido registrado y pagado por el cliente',  DATE_SUB(NOW(), INTERVAL '5 0:00' DAY_MINUTE)),
    (2, 2, 3, 'Pedido aceptado y enviado a cocina',         DATE_SUB(NOW(), INTERVAL '4 23:52' DAY_MINUTE)),
    (2, 3, 4, 'Cocina inició la preparación',               DATE_SUB(NOW(), INTERVAL '4 23:48' DAY_MINUTE)),
    (2, 4, 4, 'Preparación finalizada',                     DATE_SUB(NOW(), INTERVAL '4 23:30' DAY_MINUTE)),
    (2, 5, 3, 'El pedido salió del local hacia el cliente', DATE_SUB(NOW(), INTERVAL '4 23:10' DAY_MINUTE)),
    (2, 6, 3, 'Pedido entregado a domicilio',               DATE_SUB(NOW(), INTERVAL '4 22:55' DAY_MINUTE));

INSERT INTO orden_cocina (id_pedido, estado, iniciado_en, completado_en, creado_en) VALUES
    (2, 'completado', DATE_SUB(NOW(), INTERVAL '4 23:48' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '4 23:30' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '4 23:52' DAY_MINUTE));  -- orden 2

-- El Combo Familiar (detalle 3) se descompone en sus productos individuales
INSERT INTO item_orden_cocina (id_orden_cocina, id_detalle, id_producto, cantidad, id_estacion_actual, estado, completado_por_usuario_id, iniciado_en, completado_en) VALUES
    (2, 3, 3,  2, 3, 'completado', 4, DATE_SUB(NOW(), INTERVAL '4 23:48' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '4 23:35' DAY_MINUTE)),
    (2, 3, 13, 1, 3, 'completado', 4, DATE_SUB(NOW(), INTERVAL '4 23:48' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '4 23:36' DAY_MINUTE)),
    (2, 3, 16, 2, 1, 'completado', 4, DATE_SUB(NOW(), INTERVAL '4 23:48' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '4 23:45' DAY_MINUTE)),
    (2, 4, 16, 2, 1, 'completado', 4, DATE_SUB(NOW(), INTERVAL '4 23:48' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '4 23:45' DAY_MINUTE));

-- ------------------------------------------------------------
-- Pedido 3 (PED-2026-0003) — Carlos, recogida, tarjeta de débito, LISTO (ayer)
-- CON CUPÓN: CLASICO15 (15% en Corn Dog Clásico)
-- 1x Corn Dog Clásico (₡2500, desc. 375) + 1x Corn Dog de Chocolate (₡3500)
-- Cobrado 5625 (6000 menos el descuento): IVA incluido 647.12, base 4977.88
-- ------------------------------------------------------------
INSERT INTO pedido (id_cliente, id_empleado, id_estado, numero_pedido, tipo_entrega, subtotal, tasa_impuesto, monto_impuesto, costo_envio, monto_descuento, monto_total, creado_en) VALUES
    (1, NULL, 4, 'PED-2026-0003', 'recogida', 4977.88, 0.1300, 647.12, 0.00, 375.00, 5625.00, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO detalle_pedido (id_pedido, id_producto, id_combo, cantidad, precio_unitario, precio_total, monto_descuento, observaciones) VALUES
    (3, 1, NULL, 1, 2500.00, 2500.00, 375.00, NULL),                                  -- detalle 5 (cupón CLASICO15)
    (3, 4, NULL, 1, 3500.00, 3500.00, 0.00, 'Con chispas de colores extra');          -- detalle 6

INSERT INTO pedido_cupon (id_pedido, id_cupon) VALUES (3, 1);
UPDATE cupon SET cantidad_usos = cantidad_usos + 1 WHERE id_cupon = 1;

INSERT INTO pago (id_pedido, id_metodo, monto, estado_pago, id_transaccion, ultimos_cuatro, titular_tarjeta, vencimiento_tarjeta, procesado_en) VALUES
    (3, 2, 5625.00, 'completado', 'TXN-SIM-0003', '1881', 'Carlos Jiménez Vargas', '03/2028', DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO seguimiento_pedido (id_pedido, id_estado, cambiado_por_usuario_id, comentario, cambiado_en) VALUES
    (3, 1, 1, 'Pedido registrado y pagado por el cliente', DATE_SUB(NOW(), INTERVAL '1 0:00' DAY_MINUTE)),
    (3, 2, 3, 'Pedido aceptado y enviado a cocina',        DATE_SUB(NOW(), INTERVAL '0 23:54' DAY_MINUTE)),
    (3, 3, 4, 'Cocina inició la preparación',              DATE_SUB(NOW(), INTERVAL '0 23:50' DAY_MINUTE)),
    (3, 4, 4, 'Preparación finalizada, listo para recoger',DATE_SUB(NOW(), INTERVAL '0 23:38' DAY_MINUTE));

INSERT INTO orden_cocina (id_pedido, estado, iniciado_en, completado_en, creado_en) VALUES
    (3, 'completado', DATE_SUB(NOW(), INTERVAL '0 23:50' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '0 23:38' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '0 23:54' DAY_MINUTE));  -- orden 3

INSERT INTO item_orden_cocina (id_orden_cocina, id_detalle, id_producto, cantidad, id_estacion_actual, estado, completado_por_usuario_id, iniciado_en, completado_en) VALUES
    (3, 5, 1, 1, 3, 'completado', 4, DATE_SUB(NOW(), INTERVAL '0 23:50' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '0 23:41' DAY_MINUTE)),
    (3, 6, 4, 1, 3, 'completado', 4, DATE_SUB(NOW(), INTERVAL '0 23:50' DAY_MINUTE), DATE_SUB(NOW(), INTERVAL '0 23:38' DAY_MINUTE));

-- ------------------------------------------------------------
-- Pedido 4 (PED-2026-0004) — María, registrado por la ENCARGADA, recogida,
-- efectivo, EN PREPARACIÓN (hace 2 horas): así el tablero de cocina
-- siempre tiene trabajo pendiente al reimportar.
-- 2x Corn Dog de Queso (₡3000) + 1x Combo Snack (₡2500)
-- Cobrado 8500 (IVA incluido 977.88, base 7522.12) — efectivo: 10000, vuelto 1500
-- ------------------------------------------------------------
INSERT INTO pedido (id_cliente, id_empleado, id_estado, numero_pedido, tipo_entrega, subtotal, tasa_impuesto, monto_impuesto, costo_envio, monto_descuento, monto_total, creado_en) VALUES
    (2, 3, 3, 'PED-2026-0004', 'recogida', 7522.12, 0.1300, 977.88, 0.00, 0.00, 8500.00, DATE_SUB(NOW(), INTERVAL 2 HOUR));

INSERT INTO detalle_pedido (id_pedido, id_producto, id_combo, cantidad, precio_unitario, precio_total, monto_descuento, observaciones) VALUES
    (4, 2, NULL, 2, 3000.00, 6000.00, 0.00, 'Sin azúcar espolvoreada'),               -- detalle 7
    (4, NULL, 4, 1, 2500.00, 2500.00, 0.00, NULL);                                    -- detalle 8

INSERT INTO pago (id_pedido, id_metodo, monto, estado_pago, id_transaccion, efectivo_recibido, vuelto, procesado_en) VALUES
    (4, 3, 8500.00, 'completado', 'TXN-SIM-0004', 10000.00, 1500.00, DATE_SUB(NOW(), INTERVAL 2 HOUR));

INSERT INTO seguimiento_pedido (id_pedido, id_estado, cambiado_por_usuario_id, comentario, cambiado_en) VALUES
    (4, 1, 3, 'Pedido registrado en mostrador por la encargada', DATE_SUB(NOW(), INTERVAL 120 MINUTE)),
    (4, 2, 3, 'Pedido aceptado y enviado a cocina',              DATE_SUB(NOW(), INTERVAL 115 MINUTE)),
    (4, 3, 4, 'Cocina inició la preparación',                    DATE_SUB(NOW(), INTERVAL 110 MINUTE));

INSERT INTO orden_cocina (id_pedido, estado, iniciado_en, creado_en) VALUES
    (4, 'en_proceso', DATE_SUB(NOW(), INTERVAL 110 MINUTE), DATE_SUB(NOW(), INTERVAL 115 MINUTE));  -- orden 4

-- El Combo Snack (detalle 8) se descompone; items en distintas etapas para el tablero
INSERT INTO item_orden_cocina (id_orden_cocina, id_detalle, id_producto, cantidad, id_estacion_actual, estado, iniciado_en) VALUES
    (4, 7, 2,  2, 2, 'en_proceso', DATE_SUB(NOW(), INTERVAL 110 MINUTE)),   -- Corn Dogs de Queso en Fritura
    (4, 8, 9,  1, 1, 'pendiente',  NULL),                                    -- Aros de Cebolla esperando en Preparación
    (4, 8, 17, 1, 1, 'pendiente',  NULL);                                    -- Té Frío esperando en Preparación

-- ------------------------------------------------------------
-- Pedido 5 (PED-2026-0005) — Carlos, recogida, tarjeta de crédito,
-- REGISTRADO (hace 15 minutos): para demostrar en vivo la aceptación
-- del encargado y el flujo completo hacia cocina.
-- 1x Corn Dog Mixto (₡3200) + 1x Papas Fritas Clásicas (₡1500)
-- Cobrado 4700 (IVA incluido 540.71, base 4159.29)
-- ------------------------------------------------------------
INSERT INTO pedido (id_cliente, id_empleado, id_estado, numero_pedido, tipo_entrega, subtotal, tasa_impuesto, monto_impuesto, costo_envio, monto_descuento, monto_total, creado_en) VALUES
    (1, NULL, 1, 'PED-2026-0005', 'recogida', 4159.29, 0.1300, 540.71, 0.00, 0.00, 4700.00, DATE_SUB(NOW(), INTERVAL 15 MINUTE));

INSERT INTO detalle_pedido (id_pedido, id_producto, id_combo, cantidad, precio_unitario, precio_total, monto_descuento, observaciones) VALUES
    (5, 3, NULL, 1, 3200.00, 3200.00, 0.00, 'Extra ketchup'),                         -- detalle 9
    (5, 7, NULL, 1, 1500.00, 1500.00, 0.00, NULL);                                    -- detalle 10

INSERT INTO pago (id_pedido, id_metodo, monto, estado_pago, id_transaccion, ultimos_cuatro, titular_tarjeta, vencimiento_tarjeta, procesado_en) VALUES
    (5, 1, 4700.00, 'completado', 'TXN-SIM-0005', '4242', 'Carlos Jiménez Vargas', '08/2027', DATE_SUB(NOW(), INTERVAL 15 MINUTE));

INSERT INTO seguimiento_pedido (id_pedido, id_estado, cambiado_por_usuario_id, comentario, cambiado_en) VALUES
    (5, 1, 1, 'Pedido registrado y pagado por el cliente', DATE_SUB(NOW(), INTERVAL 15 MINUTE));

-- ------------------------------------------------------------
-- Pedido 6 (PED-2026-0006) — María, A DOMICILIO, efectivo, EN CAMINO:
-- salió del local hace 4 minutos y la duración estimada es de 13, así que
-- al reimportar el mapa de seguimiento siempre muestra al repartidor
-- avanzando por la ruta.
-- 2x Corn Dog Clásico (₡2500) + 1x Papas Fritas Clásicas (₡1500)
-- Cobrado 6500 (IVA incluido 747.79, base 5752.21) + envío 2075 (Zona media:
-- 800 de base + 250 por km x 5,10 km). Total 8575.00 — efectivo 10000, vuelto 1425.00
-- ------------------------------------------------------------
INSERT INTO pedido (id_cliente, id_empleado, id_estado, numero_pedido, tipo_entrega, subtotal, tasa_impuesto, monto_impuesto, costo_envio, monto_descuento, monto_total, creado_en) VALUES
    (2, NULL, 5, 'PED-2026-0006', 'domicilio', 5752.21, 0.1300, 747.79, 2075.00, 0.00, 8575.00, DATE_SUB(NOW(), INTERVAL 40 MINUTE));

INSERT INTO detalle_pedido (id_pedido, id_producto, id_combo, cantidad, precio_unitario, precio_total, monto_descuento, observaciones) VALUES
    (6, 1, NULL, 2, 2500.00, 5000.00, 0.00, 'Sin mostaza'),                           -- detalle 11
    (6, 7, NULL, 1, 1500.00, 1500.00, 0.00, NULL);                                    -- detalle 12

INSERT INTO pago (id_pedido, id_metodo, monto, estado_pago, id_transaccion, efectivo_recibido, vuelto, procesado_en) VALUES
    (6, 3, 8575.00, 'completado', 'TXN-SIM-0006', 10000.00, 1425.00, DATE_SUB(NOW(), INTERVAL 40 MINUTE));

INSERT INTO envio (id_pedido, id_tarifa, costo_envio, distancia_km, duracion_estimada_min,
                   direccion_texto, latitud, longitud, referencia, nombre_receptor, telefono_receptor,
                   repartidor, tstamp_salida) VALUES
    (6, 2, 2075.00, 5.10, 13,
     'San Antonio de Alajuela, 300 m este de la escuela, condominio Los Higuerones, casa 14',
     10.04800000, -84.17800000, 'Apartamento en el segundo piso', 'María Rodríguez Soto', '8888-2222',
     'Luis Vargas', DATE_SUB(NOW(), INTERVAL 4 MINUTE));

INSERT INTO seguimiento_pedido (id_pedido, id_estado, cambiado_por_usuario_id, comentario, cambiado_en) VALUES
    (6, 1, 2, 'Pedido registrado y pagado por el cliente',  DATE_SUB(NOW(), INTERVAL 40 MINUTE)),
    (6, 2, 3, 'Pedido aceptado y enviado a cocina',         DATE_SUB(NOW(), INTERVAL 36 MINUTE)),
    (6, 3, 4, 'Cocina inició la preparación',               DATE_SUB(NOW(), INTERVAL 34 MINUTE)),
    (6, 4, 4, 'Preparación finalizada, listo para entregar',DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
    (6, 5, 3, 'El pedido salió del local hacia el cliente', DATE_SUB(NOW(), INTERVAL 4 MINUTE));

INSERT INTO orden_cocina (id_pedido, estado, iniciado_en, completado_en, creado_en) VALUES
    (6, 'completado', DATE_SUB(NOW(), INTERVAL 34 MINUTE), DATE_SUB(NOW(), INTERVAL 20 MINUTE), DATE_SUB(NOW(), INTERVAL 36 MINUTE));  -- orden 5

INSERT INTO item_orden_cocina (id_orden_cocina, id_detalle, id_producto, cantidad, id_estacion_actual, estado, completado_por_usuario_id, iniciado_en, completado_en) VALUES
    (5, 11, 1, 2, 3, 'completado', 4, DATE_SUB(NOW(), INTERVAL 34 MINUTE), DATE_SUB(NOW(), INTERVAL 22 MINUTE)),
    (5, 12, 7, 1, 2, 'completado', 4, DATE_SUB(NOW(), INTERVAL 34 MINUTE), DATE_SUB(NOW(), INTERVAL 20 MINUTE));
