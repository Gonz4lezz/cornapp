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
    ('Pendiente de pago', 'Se registró el pedido pero está pendiente el pago'),
    ('Aceptado',          'El pedido está pagado y en espera de ser preparado'),
    ('En preparación',    'El pedido se encuentra en cocina'),
    ('Procesando',        'Ha finalizado su proceso en cocina'),
    ('Entregado',         'Ha sido entregado al cliente');

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
-- INGREDIENTES
-- ============================================================

INSERT INTO ingrediente (nombre, descripcion, precio_extra, es_alergeno) VALUES
('Masa de maíz',         'Masa de maíz dulce estilo coreano',                         NULL,    FALSE),
    ('Salchicha americana',  'Salchicha tipo hot dog premium',                        NULL,    FALSE),
    ('Queso mozzarella',     'Queso mozzarella derretido',                            500.00,  TRUE),
    ('Azúcar',               'Azúcar blanca para cobertura',                          NULL,    FALSE),
    ('Aceite vegetal',       'Aceite para fritura profunda',                           NULL,    FALSE), --5
    ('Ketchup',              'Salsa de tomate',                                       NULL,    FALSE),
    ('Mostaza',              'Mostaza amarilla americana',                            NULL,    FALSE),
    ('Papas',                'Papas cortadas estilo french fries',                    NULL,    FALSE),
    ('Sal',                  'Sal de mesa',                                           NULL,    FALSE),
    ('Chocolate',            'Chocolate derretido para cobertura',                    300.00,  TRUE), --10
    ('Maple syrup',          'Jarabe de maple canadiense',                            400.00,  FALSE),
    ('Cheddar',              'Queso cheddar rallado',                                 500.00,  TRUE),
    ('Tocino',               'Tocino crujiente desmenuzado',                          600.00,  FALSE),
    ('Jalapeño',             'Chile jalapeño en rodajas',                             200.00,  FALSE),
    ('Leche',                'Leche entera para batidos',                             NULL,    TRUE), --15
    ('Helado de vainilla',   'Helado artesanal de vainilla',                          NULL,    TRUE),
    ('Café',                 'Café molido premium',                                   NULL,    FALSE),
    ('Panko',                'Pan rallado japonés para cobertura crujiente',          NULL,    TRUE),
    ('Salchicha coreana',    'Salchicha estilo coreano con especias',                 NULL,    FALSE), 
    ('Miel',                 'Miel de abeja',                                         500.00,  TRUE), --20
    ('Tomate',               'Tomate',                                                500.00,  TRUE), --20
    ('tostadas',             'Tortillas de maíz tostadas',                            600.00,  FALSE),
    ('Brócoli',              'Brócoli',                                               200.00,  TRUE),
    ('Queso Turrialba',      'Queso turrialba',                                       NULL,    TRUE),
    ('Pollo',                'Trocitos de pollo',                                     NULL,    TRUE),
    ('Carne',                'Carne Desmechada',                                      NULL,    FALSE), --25
    ('Leche',                'Leche',                                                 NULL,    TRUE),
    ('Queso Amarillo',       'Salsa de Queso Amarillo Americano',                     NULL,    TRUE);

-- ============================================================
-- PRODUCTOS (más de 3 por categoría para variedad)
-- ============================================================

-- Categoría 1: Corn Dogs
INSERT INTO producto (id_categoria, nombre, descripcion, precio_base, tiempo_preparacion, disponible) VALUES
    (1, 'Corn Dog Clásico',        'El auténtico corn dog coreano con salchicha americana envuelta en masa de maíz dulce, frito hasta dorar.',                      2500.00, 8,  TRUE),
    (1, 'Corn Dog de Queso',       'Corn dog relleno de queso mozzarella derretido que se estira con cada mordida. Cubierto con azúcar.',                            3000.00, 10, TRUE),
    (1, 'Corn Dog Mixto',          'Lo mejor de ambos mundos: mitad salchicha, mitad queso mozzarella. El favorito de la casa.',                                     3200.00, 10, TRUE),
    (1, 'Corn Dog de Chocolate',   'Corn dog cubierto con chocolate derretido y chispas de colores. Perfecto para los amantes del dulce.',                           3500.00, 12, TRUE),
    (1, 'Corn Dog Cheddar Bacon',  'Corn dog con queso cheddar y trocitos de tocino crujiente en la masa. Sabor intenso y adictivo.',                               3800.00, 12, TRUE),
    (1, 'Corn Dog Picante',        'Corn dog con jalapeños en la masa y salsa picante. Para los valientes del sabor.',                                               3000.00, 10, TRUE);

-- Categoría 2: Acompañamientos
INSERT INTO producto (id_categoria, nombre, descripcion, precio_base, tiempo_preparacion, disponible) VALUES
    (2, 'Papas Fritas Clásicas',   'Papas fritas doradas y crujientes con sal marina. El acompañamiento perfecto.',                                                 1500.00, 6,  TRUE),
    (2, 'Papas con Cheddar',       'Papas fritas bañadas en salsa de queso cheddar fundido y tocino crujiente.',                                                    2200.00, 8,  TRUE),
    (2, 'Aros de Cebolla',         'Aros de cebolla empanizados con panko japonés, fritos hasta quedar crujientes.',                                                1800.00, 7,  TRUE),
    (2, 'Papas Fritas Con Queso Derretido',        'Papas fritas bañadas en salsa de queso cheddar fundido y tocino crujiente.',                                    2500.00, 8,  TRUE),
    (2, 'Sopa De Tomate',         'Deliciosa sopa de tomate casera acompañada con tostadas.',                                                                       1800.00, 7,  TRUE),
    (2, 'Sopa De Brócoli',        'Deliciosa sopa de brócoli casera acompañada con queso turrialba..',                                                                  2500.00, 8,  TRUE),
    (2, 'Papas Supremas', 'Papas fritas doradas y crujientes con sal marina. Bañadas en queso mozzarela derretido y queso amarillo. ¡Elige tu opción de proteína entre pollo, carne o mixta!',                                    2500.00, 8,  TRUE);

-- Categoría 3: Bebidas
INSERT INTO producto (id_categoria, nombre, descripcion, precio_base, tiempo_preparacion, disponible) VALUES
    (3, 'Limonada Natural',        'Limonada fresca preparada al momento con limones naturales y un toque de menta.',                                                1200.00, 3,  TRUE),
    (3, 'Milkshake de Vainilla',   'Batido cremoso de helado de vainilla artesanal con leche fresca.',                                                               2000.00, 5,  TRUE),
    (3, 'Refresco',          'Botella de 750ml.',                                                                                                                    1000.00, 3,  TRUE),
    (3, 'Té Frio',    'Botella de 750ml.',                                                                                                                           1300.00, 3,  TRUE);

-- ============================================================
-- PRODUCTO_INGREDIENTE (relaciones)
-- ============================================================

-- Corn Dog Clásico (id_producto = 1)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (1, 1, TRUE),   -- Masa de maíz
    (1, 2, TRUE),   -- Salchicha americana
    (1, 5, FALSE),  -- Aceite vegetal
    (1, 4, FALSE);  -- Azúcar

-- Corn Dog de Queso (id_producto = 2)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (2, 1, TRUE),   -- Masa de maíz
    (2, 3, TRUE),   -- Queso mozzarella
    (2, 5, FALSE),  -- Aceite vegetal
    (2, 4, FALSE);  -- Azúcar

-- Corn Dog Mixto (id_producto = 3)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (3, 1, TRUE),   -- Masa de maíz
    (3, 2, TRUE),   -- Salchicha americana
    (3, 3, TRUE),   -- Queso mozzarella
    (3, 5, FALSE),  -- Aceite vegetal
    (3, 4, FALSE);  -- Azúcar

-- Corn Dog de Chocolate (id_producto = 4)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (4, 1, TRUE),   -- Masa de maíz
    (4, 2, TRUE),   -- Salchicha americana
    (4, 10, TRUE),  -- Chocolate
    (4, 5, FALSE),  -- Aceite vegetal
    (4, 4, FALSE);  -- Azúcar

-- Corn Dog Cheddar Bacon (id_producto = 5)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (5, 1, TRUE),   -- Masa de maíz
    (5, 2, TRUE),   -- Salchicha americana
    (5, 12, TRUE),  -- Cheddar
    (5, 13, TRUE),  -- Tocino
    (5, 5, FALSE);  -- Aceite vegetal

-- Corn Dog Picante (id_producto = 6)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (6, 1, TRUE),   -- Masa de maíz
    (6, 19, TRUE),  -- Salchicha coreana
    (6, 14, TRUE),  -- Jalapeño
    (6, 5, FALSE);  -- Aceite vegetal

-- Papas Fritas Clásicas (id_producto = 7)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (7, 8, TRUE),   -- Papas
    (7, 9, FALSE),  -- Sal
    (7, 5, FALSE);  -- Aceite vegetal

-- Papas con Queso Derretido (id_producto = 8)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (8, 8, TRUE),   -- Papas
    (8, 12, TRUE),  -- Cheddar
    (8, 5, FALSE);  -- Aceite vegetal

-- Aros de Cebolla (id_producto = 9)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (9, 18, TRUE),  -- Panko
    (9, 5, FALSE);  -- Aceite vegetal

-- Sopa de Tomate (id_producto = 10)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (10, 21, TRUE), -- Tomate
    (10, 22, FALSE); -- Tostadas

-- Limonada Natural (id_producto = 11)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (11, 4, FALSE); -- Azúcar

-- Milkshake de Vainilla (id_producto = 12)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (12, 15, TRUE),  -- Leche
    (12, 16, TRUE);  -- Helado de vainilla

-- Refresco (id_producto = 13)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (13, 4, False);  -- Azúcar

-- Té Frío (id_producto = 14)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (14, 4, FALSE);  -- Azúcar

-- Sopa de Brócoli (id_producto = 15)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (15, 23, TRUE);  -- Brócoli
    (15, 14, TRUE);  -- Leche
    (15, 24, TRUE);  -- Queso Turrialba

-- Papas Supremas (id_producto = 16)
INSERT INTO producto_ingrediente (id_producto, id_ingrediente, es_ingrediente_principal) VALUES
    (16, 25, TRUE);  -- Pollo
    (16, 26, TRUE);  -- Carne
    (16, 8, FALSE);  -- Papas
    (16, 3, FALSE);  -- Queso Mozzarela
    (16, 27, FALSE);  -- Queso Amarillo
    
-- ============================================================
-- IMÁGENES DE PRODUCTOS (URLs placeholder)
-- ============================================================

INSERT INTO imagen_producto (id_producto, url_imagen, texto_alt, es_principal, orden_display) VALUES
    (1,  'https://images.unsplash.com/photo-1619881590738-a111d176d936?w=600', 'Corn Dog Clásico',       TRUE,  1),
    (2,  'https://images.unsplash.com/photo-1619881590738-a111d176d936?w=600', 'Corn Dog de Queso',      TRUE,  1),
    (3,  'https://images.unsplash.com/photo-1619881590738-a111d176d936?w=600', 'Corn Dog Mixto',         TRUE,  1),
    (4,  'https://images.unsplash.com/photo-1619881590738-a111d176d936?w=600', 'Corn Dog de Chocolate',  TRUE,  1),
    (5,  'https://images.unsplash.com/photo-1619881590738-a111d176d936?w=600', 'Corn Dog Cheddar Bacon', TRUE,  1),
    (6,  'https://images.unsplash.com/photo-1619881590738-a111d176d936?w=600', 'Corn Dog Picante',       TRUE,  1),
    (7,  'https://images.unsplash.com/photo-1630384060421-cb20aebe4905?w=600', 'Papas Fritas Clásicas',  TRUE,  1),
    (8,  'https://images.unsplash.com/photo-1630384060421-cb20aebe4905?w=600', 'Papas con Cheddar',      TRUE,  1),
    (9,  'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600', 'Aros de Cebolla',        TRUE,  1),
    (10, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600',    'Nuggets de Pollo',       TRUE,  1),
    (11, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600', 'Limonada Natural',       TRUE,  1),
    (12, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600', 'Milkshake de Vainilla',  TRUE,  1),
    (13, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600', 'Café Americano',         TRUE,  1),
    (14, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600',    'Té Helado de Durazno',   TRUE,  1);

-- ============================================================
-- COMBOS (con 2 y 3 productos como pide el avance)
-- ============================================================

INSERT INTO combo (id_categoria, nombre, descripcion, precio_combo) VALUES
    (4, 'Combo Clásico',         'Un Corn Dog Clásico + Papas Fritas + Limonada Natural. El combo ideal para probar nuestro producto estrella.',               4500.00),
    (4, 'Combo Queso Lovers',    'Un Corn Dog de Queso + Papas con Cheddar + Milkshake de Vainilla. Para los amantes del queso.',                               6500.00),
    (4, 'Combo Familiar',        'Dos Corn Dogs Mixtos + Papas Fritas + Dos Limonadas. Perfecto para compartir en familia.',                                    9000.00),
    (4, 'Combo Snack',           'Aros de Cebolla + Limonada Natural. Un snack rápido y delicioso.',                                                            2500.00);

-- Combo Clásico: 3 productos (Corn Dog Clásico + Papas + Limonada)
INSERT INTO combo_producto (id_combo, id_producto, cantidad) VALUES
    (1, 1, 1),   -- Corn Dog Clásico
    (1, 7, 1),   -- Papas Fritas Clásicas
    (1, 11, 1);  -- Limonada Natural

-- Combo Queso Lovers: 3 productos
INSERT INTO combo_producto (id_combo, id_producto, cantidad) VALUES
    (2, 2, 1),   -- Corn Dog de Queso
    (2, 8, 1),   -- Papas con Cheddar
    (2, 12, 1);  -- Milkshake de Vainilla

-- Combo Familiar: 3 productos (con cantidades)
INSERT INTO combo_producto (id_combo, id_producto, cantidad) VALUES
    (3, 3, 2),   -- 2x Corn Dog Mixto
    (3, 7, 1),   -- Papas Fritas Clásicas
    (3, 11, 2);  -- 2x Limonada Natural

-- Combo Snack: 2 productos
INSERT INTO combo_producto (id_combo, id_producto, cantidad) VALUES
    (4, 9, 1),   -- Aros de Cebolla
    (4, 11, 1);  -- Limonada Natural

-- Imágenes de combos
INSERT INTO imagen_combo (id_combo, url_imagen, texto_alt, es_principal) VALUES
    (1, 'https://images.unsplash.com/photo-1619881590738-a111d176d936?w=600', 'Combo Clásico',       TRUE),
    (2, 'https://images.unsplash.com/photo-1619881590738-a111d176d936?w=600', 'Combo Queso Lovers',  TRUE),
    (3, 'https://images.unsplash.com/photo-1619881590738-a111d176d936?w=600', 'Combo Familiar',      TRUE),
    (4, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600', 'Combo Snack',         TRUE);

-- ============================================================
-- MENÚS (con horarios variados)
-- ============================================================

INSERT INTO menu (nombre, descripcion, esta_activo) VALUES
    ('Menú del Día',           'Nuestro menú principal disponible de lunes a sábado.',                  TRUE),
    ('Menú de Fin de Semana',  'Menú especial con combos exclusivos para sábado y domingo.',            TRUE),
    ('Menú Happy Hour',        'Promociones especiales en bebidas y snacks de 3:00 pm a 6:00 pm.',      TRUE);

-- Horarios del Menú del Día (lunes a viernes, 10am-9pm)
INSERT INTO horario_menu (id_menu, dia_semana, hora_inicio, hora_fin) VALUES
    (1, 1, '10:00:00', '21:00:00'),  -- Lunes
    (1, 2, '10:00:00', '21:00:00'),  -- Martes
    (1, 3, '10:00:00', '21:00:00'),  -- Miércoles
    (1, 4, '10:00:00', '21:00:00'),  -- Jueves
    (1, 5, '10:00:00', '21:00:00'),  -- Viernes
    (1, 6, '10:00:00', '21:00:00');  -- Sábado

-- Horarios del Menú de Fin de Semana (sáb-dom, 11am-10pm)
INSERT INTO horario_menu (id_menu, dia_semana, hora_inicio, hora_fin) VALUES
    (2, 6, '11:00:00', '22:00:00'),  -- Sábado
    (2, 0, '11:00:00', '22:00:00');  -- Domingo

-- Horarios del Happy Hour (lunes a viernes, 3pm-6pm)
INSERT INTO horario_menu (id_menu, dia_semana, hora_inicio, hora_fin) VALUES
    (3, 1, '15:00:00', '18:00:00'),
    (3, 2, '15:00:00', '18:00:00'),
    (3, 3, '15:00:00', '18:00:00'),
    (3, 4, '15:00:00', '18:00:00'),
    (3, 5, '15:00:00', '18:00:00');

-- Productos en Menú del Día
INSERT INTO menu_producto (id_menu, id_producto, orden_display) VALUES
    (1, 1, 1),   -- Corn Dog Clásico
    (1, 2, 2),   -- Corn Dog de Queso
    (1, 3, 3),   -- Corn Dog Mixto
    (1, 5, 4),   -- Corn Dog Cheddar Bacon
    (1, 6, 5),   -- Corn Dog Picante
    (1, 7, 1),   -- Papas Fritas Clásicas
    (1, 8, 2),   -- Papas con Cheddar
    (1, 9, 3),   -- Aros de Cebolla
    (1, 10, 4),  -- Nuggets de Pollo
    (1, 11, 1),  -- Limonada Natural
    (1, 12, 2),  -- Milkshake de Vainilla
    (1, 13, 3),  -- Café Americano
    (1, 14, 4);  -- Té Helado

-- Combos en Menú del Día
INSERT INTO menu_combo (id_menu, id_combo, orden_display) VALUES
    (1, 1, 1),   -- Combo Clásico
    (1, 2, 2),   -- Combo Queso Lovers
    (1, 3, 3);   -- Combo Familiar

-- Productos en Menú Fin de Semana
INSERT INTO menu_producto (id_menu, id_producto, orden_display) VALUES
    (2, 1, 1),   -- Corn Dog Clásico
    (2, 2, 2),   -- Corn Dog de Queso
    (2, 3, 3),   -- Corn Dog Mixto
    (2, 4, 4),   -- Corn Dog de Chocolate
    (2, 5, 5),   -- Corn Dog Cheddar Bacon
    (2, 6, 6),   -- Corn Dog Picante
    (2, 7, 1),   -- Papas Fritas
    (2, 8, 2),   -- Papas con Cheddar
    (2, 9, 3),   -- Aros de Cebolla
    (2, 10, 4),  -- Nuggets
    (2, 11, 1),  -- Limonada
    (2, 12, 2),  -- Milkshake
    (2, 13, 3),  -- Café
    (2, 14, 4);  -- Té Helado

-- Combos en Menú Fin de Semana (todos)
INSERT INTO menu_combo (id_menu, id_combo, orden_display) VALUES
    (2, 1, 1),
    (2, 2, 2),
    (2, 3, 3),
    (2, 4, 4);

-- Productos en Happy Hour (solo snacks y bebidas)
INSERT INTO menu_producto (id_menu, id_producto, orden_display) VALUES
    (3, 7, 1),   -- Papas Fritas
    (3, 9, 2),   -- Aros de Cebolla
    (3, 11, 1),  -- Limonada
    (3, 12, 2),  -- Milkshake
    (3, 13, 3),  -- Café
    (3, 14, 4);  -- Té Helado

-- Combos en Happy Hour
INSERT INTO menu_combo (id_menu, id_combo, orden_display) VALUES
    (3, 4, 1);   -- Combo Snack

-- ============================================================
-- PROCESOS DE PREPARACIÓN (ejemplos con 1, 2 y 3 estaciones)
-- ============================================================

-- Proceso: Corn Dog Clásico (3 estaciones)
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (1, 8);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (1, 1, 1, 3, 'Insertar el palito en la salchicha, cubrir uniformemente con la masa de maíz dulce.'),
    (1, 2, 2, 3, 'Freír en aceite a 180°C durante 3 minutos hasta que esté dorado uniforme.'),
    (1, 3, 3, 2, 'Escurrir el exceso de aceite, espolvorear azúcar y servir con salsas.');

-- Proceso: Corn Dog de Queso (3 estaciones)
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (2, 10);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (2, 1, 1, 4, 'Insertar el palito en el bloque de mozzarella, cubrir con masa de maíz asegurando cobertura completa.'),
    (2, 2, 2, 4, 'Freír en aceite a 175°C durante 4 minutos. Temperatura más baja para que el queso se derrita sin quemar la masa.'),
    (2, 3, 3, 2, 'Escurrir, cortar la punta para mostrar el queso derretido, espolvorear azúcar.');

-- Proceso: Corn Dog Mixto (3 estaciones)
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (3, 10);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (3, 1, 1, 4, 'Ensartar mitad salchicha y mitad mozzarella en el palito, cubrir con masa de maíz.'),
    (3, 2, 2, 4, 'Freír en aceite a 177°C durante 4 minutos hasta dorar uniformemente.'),
    (3, 3, 3, 2, 'Escurrir, espolvorear azúcar, servir con ketchup y mostaza.');

-- Proceso: Papas Fritas (2 estaciones: preparación + fritura)
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (7, 6);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (4, 1, 1, 2, 'Cortar las papas en bastones uniformes, secar con papel absorbente.'),
    (4, 2, 2, 4, 'Freír a 190°C durante 4 minutos hasta quedar doradas y crujientes. Sazonar con sal.');

-- Proceso: Limonada Natural (1 estación: solo preparación)
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (11, 3);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (5, 1, 1, 3, 'Exprimir limones frescos, mezclar con agua, azúcar y hielo. Decorar con rodaja de limón y menta.');

-- Proceso: Corn Dog de Chocolate (3 estaciones)
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (4, 12);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (6, 1, 1, 3, 'Insertar palito en la salchicha, cubrir con masa de maíz.'),
    (6, 2, 2, 4, 'Freír en aceite a 180°C durante 3-4 minutos.'),
    (6, 3, 3, 5, 'Bañar con chocolate derretido templado, agregar chispas de colores, dejar enfriar 1 minuto.');

-- Proceso: Milkshake de Vainilla (1 estación)
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (12, 5);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (7, 1, 1, 5, 'Licuar helado de vainilla con leche fría, servir en vaso alto con crema batida y cereza.');

-- Proceso: Aros de Cebolla (2 estaciones)
INSERT INTO proceso_preparacion (id_producto, tiempo_estimado_total) VALUES (9, 7);
INSERT INTO paso_proceso (id_proceso, id_estacion, orden_paso, tiempo_estimado, instrucciones) VALUES
    (8, 1, 1, 3, 'Cortar cebollas en aros gruesos, pasar por harina y luego por panko japonés.'),
    (8, 2, 2, 4, 'Freír a 185°C durante 3-4 minutos hasta quedar dorados y crujientes.');
