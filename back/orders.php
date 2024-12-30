<?php
require_once 'config.php';

// Create order
function createOrder($userId, $items, $totalAmount) {
    $conn = getDBConnection();
    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("INSERT INTO orders (user_id, total_amount, status, created_at) 
                               VALUES (?, ?, 'pending', NOW())");
        $stmt->execute([$userId, $totalAmount]);
        $orderId = $conn->lastInsertId();

        $stmt = $conn->prepare("
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, customizations)
            VALUES (?, ?, ?, ?, ?)
        ");

        foreach ($items as $item) {
            $stmt->execute([
                $orderId,
                $item['product_id'],
                $item['quantity'],
                $item['price'],
                json_encode($item['customizations'])
            ]);
        }

        $conn->commit();
        return ['success' => true, 'order_id' => $orderId];
    } catch (Exception $e) {
        $conn->rollBack();
        return ['success' => false, 'message' => 'Order creation failed'];
    }
}
