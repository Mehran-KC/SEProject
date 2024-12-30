<?php
require_once 'auth.php';
require_once 'products.php';
require_once 'orders.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
switch ($action) {

    case 'send-code':
        $phone = $_POST['phone'] ?? '';
        $status = checkPhoneNumber($phone);
        if ($status) {
            echo $phone;
            echo json_encode(sendVerificationCode($phone));
        } elseif (!$status) {
            echo $phone;
            echo json_encode(['success' => false, 'message' => 'phone number is not exist']);
        } else {
            echo json_encode(['success' => false, 'message' => 'some problem']);
        }
        break;
    case 'sign-up':
        $data = json_decode(file_get_contents('php://input'), true);
        $phone = $data['phone'] ?? '';
        $name = $data['name'] ?? '';
        $email = $data['email'] ?? '';
        $dateofbirth = $data['dateofbirth'] ?? '';
        try {
            addaccount($phone, $name, $email, $dateofbirth);
            echo json_encode(sendVerificationCode(phone: $phone));
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'problem in add or send code']);
        }
        break;
    case 'verify-code':
        $phone = $_POST['phone'] ?? '';
        $code = $_POST['code'] ?? '';
        echo json_encode(verifyCode($phone, $code));
        break;

    case 'get-products':
        $category = $_GET['category'] ?? null;
        echo json_encode(getProducts($category));
        break;

    case 'create-order':
        $token = getBearerToken();
        $userId = validateToken($token);

        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            break;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        echo json_encode(createOrder($userId, $data['items'], $data['total_amount']));
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Invalid action']);
}

function getBearerToken()
{
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function validateToken($token)
{
    if (!$token) return false;
    list($header, $payload, $signature) = explode('.', $token);

    $validSignature = base64_encode(hash_hmac('sha256', "$header.$payload", 'your-secret-key', true));
    if ($signature !== $validSignature) return false;

    $payload = json_decode(base64_decode($payload), true);
    return ($payload['exp'] < time()) ? false : $payload['user_id'];
}
