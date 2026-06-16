-- ============================================================
-- CORN APP - Base de Datos Fusionada (Lo mejor de ambas)
-- Motor: MySQL 8.0+
-- Equipo: DEVSHARKS
-- ============================================================

CREATE DATABASE IF NOT EXISTS cornapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cornapp;

-- ============================================================
-- GESTIÓN DE USUARIOS
-- ============================================================

-- Catálogo de roles (tomado de compañeros: tabla catálogo en lugar de ENUM, más flexible)
CREATE TABLE rol (
    id_rol      INT          NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(100) NOT NULL,              -- 'Cliente', 'Encargado', 'Cocina', 'Administrador'
    descripcion TEXT,
    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_rol),
    UNIQUE KEY uq_rol_nombre (nombre)
);

CREATE TABLE usuario (
    id_usuario              INT          NOT NULL AUTO_INCREMENT,
    id_rol                  INT          NOT NULL,
    nombre                  VARCHAR(100) NOT NULL,
    apellido                VARCHAR(100) NOT NULL,
    correo                  VARCHAR(255) NOT NULL,
    telefono                VARCHAR(20),                -- VARCHAR, no INT, para soportar formatos con + y ceros iniciales
    contrasena_hash         VARCHAR(255) NOT NULL,      -- 255 caracteres para almacenar hash bcrypt/argon2
    correo_verificado_en    TIMESTAMP    NULL,
    esta_activo             BOOLEAN      NOT NULL DEFAULT TRUE,
    es_frecuente            BOOLEAN      NOT NULL DEFAULT FALSE,  -- Tomado de compañeros: indica cliente frecuente para promociones
    creado_en               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_usuario_correo (correo),
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol (id_rol)
);

-- Recuperación de contraseña por correo electrónico
CREATE TABLE recuperacion_contrasena (
    id_recuperacion INT          NOT NULL AUTO_INCREMENT,
    id_usuario      INT          NOT NULL,
    token           VARCHAR(255) NOT NULL,
    expira_en       TIMESTAMP    NOT NULL,
    usado_en        TIMESTAMP    NULL,
    creado_en       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_recuperacion),
    CONSTRAINT fk_recuperacion_contrasena_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
);

-- Login con Google o Facebook (funcionalidad extra)
CREATE TABLE inicio_sesion_social (
    id_inicio_social INT          NOT NULL AUTO_INCREMENT,
    id_usuario       INT          NOT NULL,
    proveedor        ENUM('google','facebook') NOT NULL,
    proveedor_id     VARCHAR(255) NOT NULL,
    creado_en        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_inicio_social),
    UNIQUE KEY uq_inicio_sesion_social_proveedor (proveedor, proveedor_id),
    CONSTRAINT fk_inicio_sesion_social_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
);

-- ============================================================
-- GESTIÓN DE PRODUCTOS
-- ============================================================

CREATE TABLE categoria (
    id_categoria  INT          NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(100) NOT NULL,
    descripcion   TEXT,
    orden_display INT          NOT NULL DEFAULT 0,
    esta_activo   BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_categoria),
    UNIQUE KEY uq_categoria_nombre (nombre)
);

CREATE TABLE ingrediente (
    id_ingrediente INT          NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(100) NOT NULL,
    descripcion    TEXT,
    precio_extra   DECIMAL(10,2) DEFAULT NULL,          -- Tomado de compañeros: precio extra por ingrediente
    es_alergeno    BOOLEAN      NOT NULL DEFAULT FALSE,
    esta_activo    BOOLEAN      NOT NULL DEFAULT TRUE,   -- Tomado de compañeros: bandera de activo
    creado_en      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_ingrediente),
    UNIQUE KEY uq_ingrediente_nombre (nombre)
);

CREATE TABLE producto (
    id_producto         INT           NOT NULL AUTO_INCREMENT,
    id_categoria        INT           NOT NULL,
    nombre              VARCHAR(150)  NOT NULL,
    descripcion         TEXT,
    precio_base         DECIMAL(10,2) NOT NULL,
    tiempo_preparacion  INT           NOT NULL DEFAULT 0,
    disponible          BOOLEAN       NOT NULL DEFAULT TRUE,   -- Tomado de compañeros: si hay ingredientes para hacerlo
    esta_activo         BOOLEAN       NOT NULL DEFAULT TRUE,   -- Tomado de compañeros: si el producto sigue vigente
    creado_en           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_producto),
    UNIQUE KEY uq_producto_nombre (nombre),
    CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria)
);

-- Relación M:N entre producto e ingrediente
CREATE TABLE producto_ingrediente (
    id_producto              INT     NOT NULL,
    id_ingrediente           INT     NOT NULL,
    es_ingrediente_principal BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id_producto, id_ingrediente),
    CONSTRAINT fk_producto_ingrediente_producto    FOREIGN KEY (id_producto)    REFERENCES producto    (id_producto) ON DELETE CASCADE,
    CONSTRAINT fk_producto_ingrediente_ingrediente FOREIGN KEY (id_ingrediente) REFERENCES ingrediente (id_ingrediente)
);

CREATE TABLE imagen_producto (
    id_imagen   INT          NOT NULL AUTO_INCREMENT,
    id_producto INT          NOT NULL,
    url_imagen  VARCHAR(500) NOT NULL,
    texto_alt   VARCHAR(255),
    es_principal BOOLEAN     NOT NULL DEFAULT FALSE,
    orden_display INT        NOT NULL DEFAULT 0,
    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_imagen),
    CONSTRAINT fk_imagen_producto_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto) ON DELETE CASCADE
);

-- Tipos de personalización de un producto (ej: 'Capa', 'Relleno', 'Salsa')
CREATE TABLE tipo_personalizacion (
    id_tipo_personalizacion INT          NOT NULL AUTO_INCREMENT,
    id_producto             INT          NOT NULL,
    nombre_tipo             VARCHAR(100) NOT NULL,
    es_obligatorio          BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_tipo_personalizacion),
    CONSTRAINT fk_tipo_personalizacion_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto) ON DELETE CASCADE
);

-- Opciones disponibles para cada tipo de personalización
CREATE TABLE opcion_personalizacion (
    id_opcion_personalizacion INT           NOT NULL AUTO_INCREMENT,
    id_tipo_personalizacion   INT           NOT NULL,
    nombre_opcion             VARCHAR(100)  NOT NULL,
    precio_adicional          DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
    esta_disponible           BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en                 TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en                TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_opcion_personalizacion),
    CONSTRAINT fk_opcion_personalizacion_tipo FOREIGN KEY (id_tipo_personalizacion)
        REFERENCES tipo_personalizacion (id_tipo_personalizacion) ON DELETE CASCADE
);

-- ============================================================
-- GESTIÓN DE COMBOS
-- ============================================================

CREATE TABLE combo (
    id_combo     INT           NOT NULL AUTO_INCREMENT,
    id_categoria INT           NOT NULL,
    nombre       VARCHAR(150)  NOT NULL,
    descripcion  TEXT,
    precio_combo DECIMAL(10,2) NOT NULL,
    esta_activo  BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_combo),
    UNIQUE KEY uq_combo_nombre (nombre),
    CONSTRAINT fk_combo_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria)
);

-- Relación M:N entre combo y producto
CREATE TABLE combo_producto (
    id_combo    INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad    INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_combo, id_producto),
    CONSTRAINT fk_combo_producto_combo    FOREIGN KEY (id_combo)    REFERENCES combo    (id_combo) ON DELETE CASCADE,
    CONSTRAINT fk_combo_producto_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto)
);

CREATE TABLE imagen_combo (
    id_imagen    INT          NOT NULL AUTO_INCREMENT,
    id_combo     INT          NOT NULL,
    url_imagen   VARCHAR(500) NOT NULL,
    texto_alt    VARCHAR(255),
    es_principal BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_imagen),
    CONSTRAINT fk_imagen_combo_combo FOREIGN KEY (id_combo) REFERENCES combo (id_combo) ON DELETE CASCADE
);

-- ============================================================
-- GESTIÓN DE MENÚ
-- ============================================================

CREATE TABLE menu (
    id_menu     INT          NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(150) NOT NULL,
    descripcion TEXT,
    esta_activo BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_menu),
    UNIQUE KEY uq_menu_nombre (nombre)
);

CREATE TABLE horario_menu (
    id_horario   INT      NOT NULL AUTO_INCREMENT,
    id_menu      INT      NOT NULL,
    dia_semana   TINYINT  NULL,         -- 0=Domingo ... 6=Sábado. NULL si aplica por rango de fechas
    hora_inicio  TIME     NOT NULL,
    hora_fin     TIME     NOT NULL,
    fecha_inicio DATE     NULL,
    fecha_fin    DATE     NULL,
    esta_activo  BOOLEAN  NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_horario),
    CONSTRAINT fk_horario_menu_menu FOREIGN KEY (id_menu) REFERENCES menu (id_menu) ON DELETE CASCADE
);

-- Relación M:N entre menu y producto
CREATE TABLE menu_producto (
    id_menu       INT NOT NULL,
    id_producto   INT NOT NULL,
    orden_display INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id_menu, id_producto),
    CONSTRAINT fk_menu_producto_menu     FOREIGN KEY (id_menu)     REFERENCES menu     (id_menu) ON DELETE CASCADE,
    CONSTRAINT fk_menu_producto_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto)
);

-- Relación M:N entre menu y combo
CREATE TABLE menu_combo (
    id_menu       INT NOT NULL,
    id_combo      INT NOT NULL,
    orden_display INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id_menu, id_combo),
    CONSTRAINT fk_menu_combo_menu  FOREIGN KEY (id_menu)  REFERENCES menu  (id_menu) ON DELETE CASCADE,
    CONSTRAINT fk_menu_combo_combo FOREIGN KEY (id_combo) REFERENCES combo (id_combo)
);

-- ============================================================
-- GESTIÓN DE PROCESO DE PREPARACIÓN
-- ============================================================

CREATE TABLE estacion_cocina (
    id_estacion    INT          NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(100) NOT NULL,
    descripcion    TEXT,
    color_estacion VARCHAR(7)   NOT NULL DEFAULT '#CCCCCC',
    esta_activo    BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_estacion),
    UNIQUE KEY uq_estacion_cocina_nombre (nombre)
);

CREATE TABLE proceso_preparacion (
    id_proceso            INT       NOT NULL AUTO_INCREMENT,
    id_producto           INT       NOT NULL,
    tiempo_estimado_total INT       NOT NULL DEFAULT 0,
    esta_activo           BOOLEAN   NOT NULL DEFAULT TRUE,
    creado_en             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_proceso),
    CONSTRAINT fk_proceso_preparacion_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto) ON DELETE CASCADE
);

CREATE TABLE paso_proceso (
    id_paso            INT  NOT NULL AUTO_INCREMENT,
    id_proceso         INT  NOT NULL,
    id_estacion        INT  NOT NULL,
    orden_paso         INT  NOT NULL,
    tiempo_estimado    INT  NOT NULL DEFAULT 0,
    instrucciones      TEXT,
    PRIMARY KEY (id_paso),
    UNIQUE KEY uq_paso_proceso_orden (id_proceso, orden_paso),
    CONSTRAINT fk_paso_proceso_proceso  FOREIGN KEY (id_proceso)  REFERENCES proceso_preparacion (id_proceso) ON DELETE CASCADE,
    CONSTRAINT fk_paso_proceso_estacion FOREIGN KEY (id_estacion) REFERENCES estacion_cocina     (id_estacion)
);

-- ============================================================
-- GESTIÓN DE PEDIDOS
-- ============================================================

-- Catálogo de estados del pedido (tomado de compañeros: tabla catálogo, más flexible que ENUM)
CREATE TABLE estado_pedido (
    id_estado     INT         NOT NULL AUTO_INCREMENT,
    nombre_estado VARCHAR(50) NOT NULL,
    descripcion   TEXT,
    PRIMARY KEY (id_estado),
    UNIQUE KEY uq_estado_pedido_nombre (nombre_estado)
);

-- Catálogo de métodos de pago (tomado de compañeros: tabla catálogo)
CREATE TABLE metodo_pago (
    id_metodo INT         NOT NULL AUTO_INCREMENT,
    nombre    VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_metodo),
    UNIQUE KEY uq_metodo_pago_nombre (nombre)
);

CREATE TABLE pedido (
    id_pedido                INT           NOT NULL AUTO_INCREMENT,
    id_cliente               INT           NOT NULL,
    id_empleado              INT           NULL,            -- NULL si el cliente autogestionó el pedido
    id_estado                INT           NOT NULL,
    numero_pedido            VARCHAR(50)   NOT NULL,
    tipo_entrega             ENUM('recogida','domicilio') NOT NULL,
    subtotal                 DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tasa_impuesto            DECIMAL(5,4)  NOT NULL DEFAULT 0.1300,
    monto_impuesto           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    costo_envio              DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
    monto_descuento          DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
    monto_total              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    instrucciones_especiales TEXT,
    creado_en                TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pedido),
    UNIQUE KEY uq_pedido_numero (numero_pedido),
    CONSTRAINT fk_pedido_cliente  FOREIGN KEY (id_cliente)  REFERENCES usuario       (id_usuario),
    CONSTRAINT fk_pedido_empleado FOREIGN KEY (id_empleado) REFERENCES usuario       (id_usuario),
    CONSTRAINT fk_pedido_estado   FOREIGN KEY (id_estado)   REFERENCES estado_pedido (id_estado)
);

-- Ítems del pedido (productos o combos)
-- Dos FK nullable con CHECK en lugar de relación polimórfica
CREATE TABLE detalle_pedido (
    id_detalle               INT           NOT NULL AUTO_INCREMENT,
    id_pedido                INT           NOT NULL,
    id_producto              INT           NULL,
    id_combo                 INT           NULL,
    cantidad                 INT           NOT NULL DEFAULT 1,
    precio_unitario          DECIMAL(10,2) NOT NULL,
    precio_total             DECIMAL(10,2) NOT NULL,
    observaciones            TEXT,
    PRIMARY KEY (id_detalle),
    CONSTRAINT chk_detalle_pedido_item CHECK (
        (id_producto IS NOT NULL AND id_combo IS NULL) OR
        (id_producto IS NULL AND id_combo IS NOT NULL)
    ),
    CONSTRAINT fk_detalle_pedido_pedido   FOREIGN KEY (id_pedido)   REFERENCES pedido   (id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto),
    CONSTRAINT fk_detalle_pedido_combo    FOREIGN KEY (id_combo)    REFERENCES combo    (id_combo)
);

-- Relación M:N: personalizaciones aplicadas a un detalle del pedido
CREATE TABLE personalizacion_detalle_pedido (
    id_detalle                INT           NOT NULL,
    id_opcion_personalizacion INT           NOT NULL,
    precio_adicional          DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id_detalle, id_opcion_personalizacion),
    CONSTRAINT fk_pers_detalle_pedido_detalle FOREIGN KEY (id_detalle)
        REFERENCES detalle_pedido (id_detalle) ON DELETE CASCADE,
    CONSTRAINT fk_pers_detalle_pedido_opcion  FOREIGN KEY (id_opcion_personalizacion)
        REFERENCES opcion_personalizacion (id_opcion_personalizacion)
);

-- ============================================================
-- SEGUIMIENTO DE PEDIDOS (fusión de ambas propuestas)
-- ============================================================

-- Historial de cambios de estado del pedido (seguimiento en tiempo real)
CREATE TABLE seguimiento_pedido (
    id_seguimiento          INT         NOT NULL AUTO_INCREMENT,
    id_pedido               INT         NOT NULL,
    id_estado               INT         NOT NULL,
    cambiado_por_usuario_id INT         NULL,
    comentario              VARCHAR(200) NULL,           -- Tomado de compañeros: comentario por cada transición
    cambiado_en             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_seguimiento),
    CONSTRAINT fk_seguimiento_pedido_pedido  FOREIGN KEY (id_pedido)               REFERENCES pedido       (id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_seguimiento_pedido_estado  FOREIGN KEY (id_estado)               REFERENCES estado_pedido (id_estado),
    CONSTRAINT fk_seguimiento_pedido_usuario FOREIGN KEY (cambiado_por_usuario_id) REFERENCES usuario       (id_usuario)
);

-- Bitácora de auditoría sobre el seguimiento (tomado de compañeros)
CREATE TABLE bitacora_seguimiento (
    id_entrada     INT          NOT NULL AUTO_INCREMENT,
    id_seguimiento INT          NOT NULL,
    accion         VARCHAR(200) NOT NULL,
    creado_en      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_entrada),
    CONSTRAINT fk_bitacora_seguimiento FOREIGN KEY (id_seguimiento)
        REFERENCES seguimiento_pedido (id_seguimiento) ON DELETE CASCADE
);

-- ============================================================
-- PROCESAMIENTO DE PAGOS
-- ============================================================

CREATE TABLE pago (
    id_pago             INT           NOT NULL AUTO_INCREMENT,
    id_pedido           INT           NOT NULL,
    id_metodo           INT           NOT NULL,
    monto               DECIMAL(10,2) NOT NULL,
    estado_pago         ENUM('pendiente','completado','fallido','reembolsado') NOT NULL DEFAULT 'pendiente',
    id_transaccion      VARCHAR(255)  NULL,
    ultimos_cuatro      VARCHAR(4)    NULL,
    titular_tarjeta     VARCHAR(200)  NULL,
    vencimiento_tarjeta VARCHAR(7)    NULL,              -- MM/AAAA
    efectivo_recibido   DECIMAL(10,2) NULL,
    vuelto              DECIMAL(10,2) NULL,
    procesado_en        TIMESTAMP     NULL,
    creado_en           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pago),
    CONSTRAINT fk_pago_pedido FOREIGN KEY (id_pedido) REFERENCES pedido     (id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_pago_metodo FOREIGN KEY (id_metodo) REFERENCES metodo_pago (id_metodo)
);

-- Cupones de descuento (se crea aquí porque pedido_cupon la referencia)
CREATE TABLE cupon (
    id_cupon                INT           NOT NULL AUTO_INCREMENT,
    codigo                  VARCHAR(50)   NOT NULL,
    nombre                  VARCHAR(150)  NOT NULL,
    descripcion             TEXT,
    tipo_descuento          ENUM('porcentaje','monto_fijo') NOT NULL,
    valor_descuento         DECIMAL(8,2)  NOT NULL,
    monto_minimo_pedido     DECIMAL(10,2) NULL,
    limite_usos             INT           NULL,
    cantidad_usos           INT           NOT NULL DEFAULT 0,
    permite_otra_promocion  BOOLEAN       NOT NULL DEFAULT FALSE,  -- Tomado de compañeros: si se puede combinar
    fecha_inicio            DATETIME      NOT NULL,
    fecha_fin               DATETIME      NOT NULL,
    esta_activo             BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_cupon),
    UNIQUE KEY uq_cupon_codigo (codigo)
);

-- Relación M:N: cupones aplicados a pedidos (tomado de compañeros: cupón vinculado al pedido)
CREATE TABLE pedido_cupon (
    id_pedido INT NOT NULL,
    id_cupon  INT NOT NULL,
    PRIMARY KEY (id_pedido, id_cupon),                  -- PK compuesta para relación M:N
    CONSTRAINT fk_pedido_cupon_pedido FOREIGN KEY (id_pedido) REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_pedido_cupon_cupon  FOREIGN KEY (id_cupon)  REFERENCES cupon  (id_cupon)
);

-- ============================================================
-- ENVÍO A DOMICILIO (sin direcciones guardadas, el cliente elige en mapa)
-- ============================================================

-- Tarifa de envío por kilómetro
CREATE TABLE tarifa_envio (
    id_tarifa       INT           NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)  NOT NULL,
    tarifa_base     DECIMAL(8,2)  NOT NULL,             -- Monto mínimo de envío
    precio_por_km   DECIMAL(6,2)  NOT NULL DEFAULT 0.00,
    distancia_maxima_km DECIMAL(6,2) NOT NULL,
    esta_activo     BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_tarifa),
    UNIQUE KEY uq_tarifa_envio_nombre (nombre)
);

-- Envío: datos de cada entrega a domicilio (fusión de ambas propuestas)
-- La dirección se captura del mapa al momento del pedido, NO se guarda en el perfil del usuario
CREATE TABLE envio (
    id_envio            INT           NOT NULL AUTO_INCREMENT,
    id_pedido           INT           NOT NULL,
    id_tarifa           INT           NULL,
    repartidor          VARCHAR(100)  NOT NULL,          -- Nombre del repartidor asignado
    costo_envio         DECIMAL(8,2)  NOT NULL,
    distancia_km        DECIMAL(6,2)  NOT NULL,          -- Kilómetros calculados desde el local
    -- Dirección capturada desde el mapa (no reutilizable)
    direccion_texto     VARCHAR(500)  NOT NULL,          -- Dirección legible generada del mapa
    latitud             DECIMAL(10,8) NOT NULL,          -- Coordenada del punto elegido en el mapa
    longitud            DECIMAL(11,8) NOT NULL,
    referencia          TEXT,                            -- Señas adicionales del cliente
    nombre_receptor     VARCHAR(200)  NOT NULL,
    telefono_receptor   VARCHAR(20)   NOT NULL,
    -- Timestamps de seguimiento del envío
    tstamp_salida       TIMESTAMP     NULL,              -- Cuando el repartidor sale del local
    tstamp_entrega      TIMESTAMP     NULL,              -- Cuando el pedido llega al cliente
    creado_en           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_envio),
    UNIQUE KEY uq_envio_pedido (id_pedido),             -- Un pedido tiene un solo envío
    CONSTRAINT fk_envio_pedido FOREIGN KEY (id_pedido) REFERENCES pedido       (id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_envio_tarifa FOREIGN KEY (id_tarifa) REFERENCES tarifa_envio (id_tarifa)
);

-- ============================================================
-- GESTIÓN DE COCINA
-- ============================================================

CREATE TABLE orden_cocina (
    id_orden_cocina INT       NOT NULL AUTO_INCREMENT,
    id_pedido       INT       NOT NULL,
    estado          ENUM('pendiente','en_proceso','completado') NOT NULL DEFAULT 'pendiente',
    iniciado_en     TIMESTAMP NULL,
    completado_en   TIMESTAMP NULL,
    creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_orden_cocina),
    UNIQUE KEY uq_orden_cocina_pedido (id_pedido),
    CONSTRAINT fk_orden_cocina_pedido FOREIGN KEY (id_pedido) REFERENCES pedido (id_pedido)
);

CREATE TABLE item_orden_cocina (
    id_item_cocina            INT       NOT NULL AUTO_INCREMENT,
    id_orden_cocina           INT       NOT NULL,
    id_detalle                INT       NOT NULL,        -- Referencia al detalle del pedido
    id_estacion_actual        INT       NULL,
    estado                    ENUM('pendiente','en_proceso','completado') NOT NULL DEFAULT 'pendiente',
    completado_por_usuario_id INT       NULL,
    iniciado_en               TIMESTAMP NULL,
    completado_en             TIMESTAMP NULL,
    PRIMARY KEY (id_item_cocina),
    CONSTRAINT fk_item_orden_cocina_orden    FOREIGN KEY (id_orden_cocina)           REFERENCES orden_cocina   (id_orden_cocina) ON DELETE CASCADE,
    CONSTRAINT fk_item_orden_cocina_detalle  FOREIGN KEY (id_detalle)                REFERENCES detalle_pedido (id_detalle),
    CONSTRAINT fk_item_orden_cocina_estacion FOREIGN KEY (id_estacion_actual)        REFERENCES estacion_cocina (id_estacion),
    CONSTRAINT fk_item_orden_cocina_usuario  FOREIGN KEY (completado_por_usuario_id) REFERENCES usuario         (id_usuario)
);

CREATE TABLE cola_estacion (
    id_cola              INT       NOT NULL AUTO_INCREMENT,
    id_estacion          INT       NOT NULL,
    id_item_cocina       INT       NOT NULL,
    posicion_cola        INT       NOT NULL,
    hora_inicio_real     TIMESTAMP NULL,
    hora_fin_real        TIMESTAMP NULL,
    creado_en            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_cola),
    CONSTRAINT fk_cola_estacion_estacion FOREIGN KEY (id_estacion)    REFERENCES estacion_cocina  (id_estacion),
    CONSTRAINT fk_cola_estacion_item     FOREIGN KEY (id_item_cocina) REFERENCES item_orden_cocina (id_item_cocina) ON DELETE CASCADE
);

-- ============================================================
-- CARRITO DE COMPRAS (PERSISTENTE ENTRE SESIONES)
-- ============================================================

CREATE TABLE carrito_compra (
    id_carrito  INT       NOT NULL AUTO_INCREMENT,
    id_usuario  INT       NOT NULL,
    id_producto INT       NULL,
    id_combo    INT       NULL,
    cantidad    INT       NOT NULL DEFAULT 1,
    creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_carrito),
    CONSTRAINT chk_carrito_compra_item CHECK (
        (id_producto IS NOT NULL AND id_combo IS NULL) OR
        (id_producto IS NULL AND id_combo IS NOT NULL)
    ),
    CONSTRAINT fk_carrito_compra_usuario  FOREIGN KEY (id_usuario)  REFERENCES usuario  (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_carrito_compra_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto),
    CONSTRAINT fk_carrito_compra_combo    FOREIGN KEY (id_combo)    REFERENCES combo    (id_combo)
);

CREATE TABLE personalizacion_carrito (
    id_carrito                INT NOT NULL,
    id_opcion_personalizacion INT NOT NULL,
    PRIMARY KEY (id_carrito, id_opcion_personalizacion),
    CONSTRAINT fk_personalizacion_carrito_carrito FOREIGN KEY (id_carrito)
        REFERENCES carrito_compra (id_carrito) ON DELETE CASCADE,
    CONSTRAINT fk_personalizacion_carrito_opcion  FOREIGN KEY (id_opcion_personalizacion)
        REFERENCES opcion_personalizacion (id_opcion_personalizacion)
);

-- ============================================================
-- FUNCIONALIDADES EXTRAS
-- ============================================================

-- Promociones automáticas
CREATE TABLE promocion (
    id_promocion        INT           NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(150)  NOT NULL,
    descripcion         TEXT,
    tipo_descuento      ENUM('porcentaje','monto_fijo') NOT NULL,
    valor_descuento     DECIMAL(8,2)  NOT NULL,
    monto_minimo_pedido DECIMAL(10,2) NULL,
    fecha_inicio        DATETIME      NOT NULL,
    fecha_fin           DATETIME      NOT NULL,
    esta_activo         BOOLEAN       NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado_en          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_promocion)
);

-- Notificaciones dentro de la aplicación
CREATE TABLE notificacion (
    id_notificacion INT          NOT NULL AUTO_INCREMENT,
    id_usuario      INT          NOT NULL,
    tipo            VARCHAR(50)  NOT NULL,
    titulo          VARCHAR(255) NOT NULL,
    mensaje         TEXT         NOT NULL,
    leido           BOOLEAN      NOT NULL DEFAULT FALSE,
    id_pedido       INT          NULL,
    creado_en       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_notificacion),
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_notificacion_pedido  FOREIGN KEY (id_pedido)  REFERENCES pedido  (id_pedido) ON DELETE SET NULL
);
