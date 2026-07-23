<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');

const MAX_REQUEST_BYTES = 65536;
const MIN_SUBMISSION_INTERVAL = 8;
const MAX_SUBMISSIONS_PER_HOUR = 8;

function respond(int $status, bool $success, string $message): void
{
    http_response_code($status);

    echo json_encode(
        [
            'success' => $success,
            'message' => $message
        ],
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );

    exit;
}

function stringLength(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }

    return strlen($value);
}

function textField(array $data, string $key): string
{
    $value = $data[$key] ?? '';

    if (!is_string($value)) {
        return '';
    }

    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = strip_tags($value);

    return trim($value);
}

function singleLine(string $value): string
{
    $value = preg_replace('/[\r\n\t]+/', ' ', $value) ?? '';
    $value = preg_replace('/\s+/u', ' ', $value) ?? '';

    return trim($value);
}

function multiline(string $value): string
{
    $value = preg_replace('/[^\P{C}\n\t]/u', '', $value) ?? '';
    $value = preg_replace("/\n{4,}/", "\n\n\n", $value) ?? '';

    return trim($value);
}

function headerSafe(string $value): string
{
    return singleLine(
        str_replace(
            ["\0", "\r", "\n", '%0a', '%0d', '%0A', '%0D'],
            '',
            $value
        )
    );
}

function normalizeHost(string $host): string
{
    $host = strtolower(trim($host));
    $host = preg_replace('/:\d+$/', '', $host) ?? '';

    return $host;
}

function requestIsSameOrigin(): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (!is_string($origin) || $origin === '') {
        return true;
    }

    $originHost = parse_url($origin, PHP_URL_HOST);
    $requestHost = $_SERVER['HTTP_HOST'] ?? '';

    if (!is_string($originHost) || !is_string($requestHost)) {
        return false;
    }

    return normalizeHost($originHost) === normalizeHost($requestHost);
}

function validContentType(): bool
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (!is_string($contentType) || $contentType === '') {
        return true;
    }

    $contentType = strtolower($contentType);

    return str_starts_with($contentType, 'multipart/form-data')
        || str_starts_with($contentType, 'application/x-www-form-urlencoded');
}

function clientIdentifier(): string
{
    $address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    if (!is_string($address) || $address === '') {
        $address = 'unknown';
    }

    return hash('sha256', $address);
}

function rateLimitFile(): string
{
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR
        . 'rolewise-contact-'
        . clientIdentifier()
        . '.json';
}

function enforceRateLimit(): void
{
    $file = rateLimitFile();
    $now = time();
    $windowStart = $now - 3600;
    $handle = @fopen($file, 'c+');

    if ($handle === false) {
        return;
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            return;
        }

        rewind($handle);
        $contents = stream_get_contents($handle);
        $timestamps = [];

        if (is_string($contents) && $contents !== '') {
            $decoded = json_decode($contents, true);

            if (is_array($decoded)) {
                $timestamps = array_values(
                    array_filter(
                        $decoded,
                        static fn($timestamp): bool =>
                        is_int($timestamp) && $timestamp >= $windowStart
                    )
                );
            }
        }

        $lastSubmission = $timestamps === []
            ? 0
            : max($timestamps);

        if ($lastSubmission > 0 && ($now - $lastSubmission) < MIN_SUBMISSION_INTERVAL) {
            flock($handle, LOCK_UN);

            respond(
                429,
                false,
                'Please wait a few seconds before submitting another inquiry.'
            );
        }

        if (count($timestamps) >= MAX_SUBMISSIONS_PER_HOUR) {
            flock($handle, LOCK_UN);

            respond(
                429,
                false,
                'Too many inquiries have been submitted. Please try again later.'
            );
        }

        $timestamps[] = $now;

        rewind($handle);
        ftruncate($handle, 0);
        fwrite(
            $handle,
            json_encode($timestamps, JSON_UNESCAPED_SLASHES)
        );
        fflush($handle);
        flock($handle, LOCK_UN);
    } finally {
        fclose($handle);
    }
}

function environmentValue(string $key, string $fallback): string
{
    $value = getenv($key);

    if (!is_string($value) || trim($value) === '') {
        return $fallback;
    }

    return trim($value);
}

function mimeSubject(string $subject): string
{
    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader(
            $subject,
            'UTF-8',
            'B',
            "\r\n"
        );
    }

    return $subject;
}

function loadRolewiseConfig(): array
{
    $configPath = __DIR__
        . DIRECTORY_SEPARATOR
        . 'config'
        . DIRECTORY_SEPARATOR
        . 'config.js';

    if (!is_readable($configPath)) {
        respond(
            500,
            false,
            'The inquiry service configuration is unavailable.'
        );
    }

    $source = file_get_contents($configPath);

    if (!is_string($source) || trim($source) === '') {
        respond(
            500,
            false,
            'The inquiry service configuration is unavailable.'
        );
    }

    $source = preg_replace(
        '/^\xEF\xBB\xBF/',
        '',
        $source
    ) ?? $source;

    $matched = preg_match(
        '/^\s*window\.ROLEWISE_CONFIG\s*=\s*(\{.*\})\s*;\s*$/s',
        $source,
        $matches
    );

    if (
        $matched !== 1 ||
        !isset($matches[1])
    ) {
        respond(
            500,
            false,
            'The inquiry service configuration is invalid.'
        );
    }

    try {
        $config = json_decode(
            $matches[1],
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    } catch (JsonException $exception) {
        respond(
            500,
            false,
            'The inquiry service configuration is invalid.'
        );
    }

    if (!is_array($config)) {
        respond(
            500,
            false,
            'The inquiry service configuration is invalid.'
        );
    }

    return $config;
}

function configString(
    array $config,
    array $path,
    string $fallback = ''
): string {
    $value = $config;

    foreach ($path as $key) {
        if (
            !is_array($value) ||
            !array_key_exists($key, $value)
        ) {
            return $fallback;
        }

        $value = $value[$key];
    }

    if (
        !is_string($value) &&
        !is_numeric($value)
    ) {
        return $fallback;
    }

    $value = trim((string) $value);

    return $value !== ''
        ? $value
        : $fallback;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');

    respond(
        405,
        false,
        'This endpoint accepts POST requests only.'
    );
}

$contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;

if (
    is_numeric($contentLength)
    && (int) $contentLength > MAX_REQUEST_BYTES
) {
    respond(
        413,
        false,
        'The submitted inquiry is too large.'
    );
}

if (!validContentType()) {
    respond(
        415,
        false,
        'Unsupported form submission format.'
    );
}

if (!requestIsSameOrigin()) {
    respond(
        403,
        false,
        'The inquiry could not be accepted from this origin.'
    );
}

$honeypot = textField($_POST, 'company');

if ($honeypot !== '') {
    respond(
        200,
        true,
        'Thank you. Your inquiry has been submitted.'
    );
}

$fullName = singleLine(textField($_POST, 'fullName'));
$email = singleLine(textField($_POST, 'email'));
$phone = singleLine(textField($_POST, 'phone'));
$inquiryType = singleLine(textField($_POST, 'inquiryType'));
$message = multiline(textField($_POST, 'message'));
$privacyConsent = textField($_POST, 'privacyConsent');
$sourcePage = singleLine(textField($_POST, 'sourcePage'));

if (
    stringLength($fullName) < 2
    || stringLength($fullName) > 120
) {
    respond(
        422,
        false,
        'Please enter a valid full name.'
    );
}

if (
    stringLength($email) > 180
    || filter_var($email, FILTER_VALIDATE_EMAIL) === false
) {
    respond(
        422,
        false,
        'Please enter a valid email address.'
    );
}

if (
    $phone !== ''
    && (
        stringLength($phone) > 30
        || preg_match('/^[+()\d\s.\-]{6,30}$/', $phone) !== 1
    )
) {
    respond(
        422,
        false,
        'Please enter a valid phone number.'
    );
}

if (
    stringLength($inquiryType) < 2
    || stringLength($inquiryType) > 120
    || preg_match('/^[a-zA-Z0-9][a-zA-Z0-9 _&\/().\-]{1,119}$/', $inquiryType) !== 1
) {
    respond(
        422,
        false,
        'Please select a valid inquiry type.'
    );
}

if (
    stringLength($message) < 20
    || stringLength($message) > 5000
) {
    respond(
        422,
        false,
        'Please provide a message between 20 and 5,000 characters.'
    );
}

if (!in_array($privacyConsent, ['1', 'true', 'on', 'yes'], true)) {
    respond(
        422,
        false,
        'Please confirm that you have read the privacy notice.'
    );
}

if (stringLength($sourcePage) > 500) {
    $sourcePage = substr($sourcePage, 0, 500);
}

enforceRateLimit();

$recipientEmail = environmentValue(
    'ROLEWISE_CONTACT_EMAIL',
    'hello@rolewise.ai'
);

$senderEmail = environmentValue(
    'ROLEWISE_SENDER_EMAIL',
    'website@rolewise.ai'
);

if (filter_var($recipientEmail, FILTER_VALIDATE_EMAIL) === false) {
    respond(
        500,
        false,
        'The inquiry service is not configured correctly.'
    );
}

if (filter_var($senderEmail, FILTER_VALIDATE_EMAIL) === false) {
    $senderEmail = 'website@rolewise.ai';
}

$safeName = headerSafe($fullName);
$safeEmail = headerSafe($email);
$safeInquiryType = headerSafe($inquiryType);
$safeSenderEmail = headerSafe($senderEmail);
$safeRecipientEmail = headerSafe($recipientEmail);

$subject = mimeSubject(
    'Rolewise AI inquiry: ' . $safeInquiryType
);

$submittedAt = gmdate('Y-m-d H:i:s') . ' UTC';

$emailBody = implode(
    "\n",
    [
        'New Rolewise AI website inquiry',
        '',
        'Submitted: ' . $submittedAt,
        'Inquiry type: ' . $inquiryType,
        'Full name: ' . $fullName,
        'Email: ' . $email,
        'Phone: ' . ($phone !== '' ? $phone : 'Not provided'),
        'Source page: ' . ($sourcePage !== '' ? $sourcePage : 'Not provided'),
        'Privacy consent: Confirmed',
        '',
        'Message:',
        $message,
        '',
        'This message was submitted through the Rolewise AI contact form.'
    ]
);

$emailBody = wordwrap($emailBody, 78);

$headers = implode(
    "\r\n",
    [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: Rolewise AI Website <' . $safeSenderEmail . '>',
        'Reply-To: ' . $safeName . ' <' . $safeEmail . '>',
        'X-Content-Type-Options: nosniff'
    ]
);

$mailSent = @mail(
    $safeRecipientEmail,
    $subject,
    $emailBody,
    $headers
);

if (!$mailSent) {
    respond(
        500,
        false,
        'Your inquiry could not be sent right now. Please try again later.'
    );
}

respond(
    200,
    true,
    'Thank you. Your inquiry has been submitted successfully.'
);
