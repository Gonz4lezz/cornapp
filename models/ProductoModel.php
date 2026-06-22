<?php

class ProductoModel
{
    private $db;

    public function __construct()
    {
        $this->db = new MySqlConnect();
    }

    public function getAll()
    {
        $sql = "SELECT p.id_producto, p.nombre, p.descripcion, p.precio_base, p.tiempo_preparacion,
                       p.disponible, p.esta_activo,
                       c.nombre AS categoria,
                       (SELECT ip.url_imagen FROM imagen_producto ip
                        WHERE ip.id_producto = p.id_producto AND ip.es_principal = 1 LIMIT 1) AS imagen
                FROM producto p
                INNER JOIN categoria c ON p.id_categoria = c.id_categoria
                WHERE p.esta_activo = 1
                ORDER BY c.orden_display ASC, c.nombre ASC, p.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function getById($id)
    {
        $id = intval($id);
        $sql = "SELECT p.id_producto, p.nombre, p.descripcion, p.precio_base, p.tiempo_preparacion,
                       p.disponible, p.esta_activo, p.creado_en, p.editado_en,
                       c.nombre AS categoria, c.id_categoria
                FROM producto p
                INNER JOIN categoria c ON p.id_categoria = c.id_categoria
                WHERE p.id_producto = $id";
        $result = $this->db->executeSQL($sql);
        // Ensure we return a single row or null. executeSQL may return false or a non-array type.
        return (is_array($result) && count($result) > 0) ? $result[0] : null;
    }

    public function getIngredientes($id)
    {
        $id = intval($id);
        $sql = "SELECT i.id_ingrediente, i.nombre, i.descripcion, i.es_alergeno,
                       pi.es_ingrediente_principal
                FROM ingrediente i
                INNER JOIN producto_ingrediente pi ON i.id_ingrediente = pi.id_ingrediente
                WHERE pi.id_producto = $id AND i.esta_activo = 1
                ORDER BY pi.es_ingrediente_principal DESC, i.nombre ASC";
        return $this->db->executeSQL($sql);
    }

    public function getImagenes($id)
    {
        $id = intval($id);
        $sql = "SELECT id_imagen, url_imagen, texto_alt, es_principal, orden_display
                FROM imagen_producto
                WHERE id_producto = $id
                ORDER BY es_principal DESC, orden_display ASC";
        return $this->db->executeSQL($sql);
    }
}
