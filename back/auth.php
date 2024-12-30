<?php
require_once 'config.php';
function checkPhoneNumber($phone){
    $data = json_decode(file_get_contents('php://input'), true);
    $phone = $data['phone'] ?? null;
    $conn = getDBConnection();

    try{
        $conn->beginTransaction();
        $stmt = $conn->prepare("SELECT id FROM users WHERE phone = ?");
        $stmt->execute([$phone]);
        if ($stmt->rowCount() === 0) {
            return false;
        }
        return true;
    }
    catch (Exception $e) {
        $conn->rollBack();
        return $e;
        
    }

}

function sendVerificationCode($phone) {
    $data = json_decode(file_get_contents('php://input'), true);
    $phone = $data['phone'] ?? null;
    $code = rand(10000, 99999);

    $conn = getDBConnection();

    try {
        $conn->beginTransaction();
        $stmt = $conn->prepare("SELECT id FROM users WHERE phone = ?");
        $stmt->execute([$phone]);
        $stmt = $conn->prepare("
            INSERT INTO verification_codes (phone, code, created_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE code = ?, created_at = NOW()
        ");
        $stmt->execute([$phone, $code, $code]);

        $conn->commit();

        return ['success' => true, 'phone' => $phone, 'code' => $code];
    } catch (Exception $e) {
        $conn->rollBack();
        return ['success' => false, 'message' => 'Failed to send verification code'];
    }
}


function verifyCode($phone, $code) {
    $conn = getDBConnection();
    $data = json_decode(file_get_contents('php://input'), true);
    $phone = $data['phone'] ?? null;
    $code = strrev($data['code'] ?? null);


    $stmt = $conn->prepare("
        SELECT * FROM verification_codes
        WHERE phone = ? AND code = ? 
        AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
    ");
    $stmt->execute([$phone, $code]);

    if ($stmt->rowCount() > 0) {
        $stmt = $conn->prepare("SELECT id FROM users WHERE phone = ?");
        $stmt->execute([$phone]);

        if ($stmt->rowCount() === 0) {
            $stmt = $conn->prepare("INSERT INTO users (phone, created_at) VALUES (?, NOW())");
            $stmt->execute([$phone]);
        }

        $userId = $stmt->fetch(PDO::FETCH_ASSOC)['id'];
        $token = generateJWT($userId);

        return ['success' => true, 'token' => $token];
    }

    return ['code' => $code,'success' => false, 'message' => 'کد تایید اشتباه است'];
}

function addaccount($phone,$name,$email,$dateofbirth){
    $conn = getDBConnection();

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("
            INSERT INTO users (phone, name, email,birthday)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$phone, $name, $email, $dateofbirth]);
        $conn->commit();

        return ['success' => true, 'phone' => $phone, 'name' => $name];
    } catch (Exception $e) {
        $conn->rollBack();
        return ['success' => false, 'message' => 'Failed to make user'];
    }
}

function generateJWT($userId) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'exp' => time() + (60 * 60 * 24 * 7)
    ]));
    $signature = hash_hmac('sha256', "$header.$payload", 'your-secret-key', true);
    return "$header.$payload." . base64_encode($signature);
}
