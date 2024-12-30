<?php
require_once 'config.php';

// Fetch products
function getProducts($category = null) {
    $conn = getDBConnection();
    $sql = "SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1";
    if ($category) {
        $sql .= " AND c.slug = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$category]);
    } else {
        $stmt = $conn->prepare($sql);
        $stmt->execute();
    }
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
