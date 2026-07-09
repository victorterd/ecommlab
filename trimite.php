<?php
/**
 * Ecomlab — endpoint formular de contact.
 * Primește POST (name, email, message) și trimite emailul de pe serverul
 * propriu către $destinatar. Fără servicii externe.
 */

declare(strict_types=1);

$destinatar = 'office.ecomlab@gmail.com';

header('X-Content-Type-Options: nosniff');

$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH'])
  || (stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false);

function raspunde(bool $success, string $mesaj, bool $isAjax): void {
  if ($isAjax) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code($success ? 200 : 400);
    echo json_encode(['success' => $success, 'message' => $mesaj], JSON_UNESCAPED_UNICODE);
  } else {
    // Fără JavaScript: înapoi la pagină, cu confirmarea în URL
    header('Location: ./?' . ($success ? 'trimis=1' : 'eroare=1') . '#contact');
  }
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  raspunde(false, 'Metodă invalidă.', $isAjax);
}

// Honeypot anti-spam: câmp invizibil care trebuie să rămână gol
if (trim((string)($_POST['_honey'] ?? '')) !== '') {
  raspunde(true, 'Mulțumim!', $isAjax); // boții primesc "succes" și pleacă
}

$nume  = trim((string)($_POST['name'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$mesaj = trim((string)($_POST['message'] ?? ''));

if (mb_strlen($nume) < 2 || mb_strlen($nume) > 120) {
  raspunde(false, 'Numele lipsește sau e prea lung.', $isAjax);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
  raspunde(false, 'Adresa de e-mail nu pare corectă.', $isAjax);
}
if (mb_strlen($mesaj) < 10 || mb_strlen($mesaj) > 5000) {
  raspunde(false, 'Mesajul lipsește sau e prea lung.', $isAjax);
}

// Anti header-injection: fără CR/LF în valorile care ajung în headere
$nume  = str_replace(["\r", "\n"], ' ', $nume);
$email = str_replace(["\r", "\n"], '', $email);

// From pe domeniul propriu (altfel emailul pică la spam); Reply-To = vizitatorul
$domeniu = preg_replace('/^www\./i', '', $_SERVER['SERVER_NAME'] ?? 'ecomlab.ro');
$from    = 'formular@' . $domeniu;

$subiect = mb_encode_mimeheader('Mesaj nou de pe site-ul Ecomlab', 'UTF-8');
$corp    = "Nume: {$nume}\nEmail: {$email}\n\nMesaj:\n{$mesaj}\n\n—\nTrimis din formularul de pe {$domeniu}";

$headere = implode("\r\n", [
  'From: Formular Ecomlab <' . $from . '>',
  'Reply-To: ' . $nume . ' <' . $email . '>',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: 8bit',
]);

$trimis = @mail($destinatar, $subiect, $corp, $headere);

if ($trimis) {
  raspunde(true, 'Mulțumim! Mesajul a fost trimis.', $isAjax);
}
raspunde(false, 'Serverul nu a putut trimite emailul.', $isAjax);
