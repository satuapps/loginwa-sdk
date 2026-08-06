<?php

namespace LoginWA\SDK;

/**
 * LoginWA PHP SDK
 *
 * A dependency-free (curl) client for the LoginWA WhatsApp API (v1).
 * Covers OTP, messaging (text + media), number check, devices (QR &
 * pairing-code linking, groups), webhooks, broadcast campaigns, and the
 * IP whitelist.
 *
 *   $wa = new \LoginWA\SDK\Client(getenv('LOGINWA_API_KEY'));
 *   $wa->sendMessage(['phone' => '6281234567890', 'message' => 'Hello!']);
 *
 * Non-2xx responses throw {@see ApiException} (getCode() = HTTP status).
 */
class Client
{
    protected string $apiKey;
    protected string $baseUrl;
    protected int $timeout;

    public function __construct(string $apiKey, string $baseUrl = 'https://api.loginwa.com/api/v1', int $timeout = 30)
    {
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->timeout = $timeout;
    }

    // --- OTP -----------------------------------------------------------------

    /**
     * @param array<string, mixed> $payload phone, country_code?, otp_length?, message_template?, device_id?, meta?
     * @return array<string, mixed>
     */
    public function startOtp(array $payload): array
    {
        return $this->request('POST', '/auth/start', $payload);
    }

    /**
     * @param array<string, mixed> $payload session_id, otp_code
     * @return array<string, mixed>
     */
    public function verifyOtp(array $payload): array
    {
        return $this->request('POST', '/auth/verify', $payload);
    }

    // --- Messaging -----------------------------------------------------------

    /**
     * Send a WhatsApp message (text or media).
     *
     * @param array<string, mixed> $payload phone (required); for text: message;
     *        for media: type (image|video|document|audio) + media_url, plus
     *        optional caption, filename, mimetype, ptt; optional device_id, meta.
     * @return array<string, mixed>
     */
    public function sendMessage(array $payload): array
    {
        return $this->request('POST', '/messages/send', $payload);
    }

    /**
     * Check which numbers are registered on WhatsApp before sending.
     *
     * @param array<int, string> $phones up to 100
     * @return array<string, mixed>
     */
    public function checkNumbers(array $phones, ?string $deviceId = null): array
    {
        return $this->request('POST', '/numbers/check', $this->compact([
            'phones' => $phones,
            'device_id' => $deviceId,
        ]));
    }

    // --- Devices -------------------------------------------------------------

    /** @return array<string, mixed> */
    public function listDevices(): array
    {
        return $this->request('GET', '/devices');
    }

    /** @return array<string, mixed> */
    public function createDevice(?string $label = null): array
    {
        return $this->request('POST', '/devices', $this->compact(['label' => $label]));
    }

    /** @return array<string, mixed> */
    public function getDevice(string $deviceId): array
    {
        return $this->request('GET', '/devices/' . rawurlencode($deviceId));
    }

    /** @return array<string, mixed> */
    public function deleteDevice(string $deviceId): array
    {
        return $this->request('DELETE', '/devices/' . rawurlencode($deviceId));
    }

    /** @return array<string, mixed> */
    public function refreshQr(string $deviceId): array
    {
        return $this->request('POST', '/devices/' . rawurlencode($deviceId) . '/refresh-qr');
    }

    /**
     * Link a device WITHOUT scanning a QR (returns an 8-char pairing_code).
     * @return array<string, mixed>
     */
    public function requestPairingCode(string $deviceId, string $phone): array
    {
        return $this->request('POST', '/devices/' . rawurlencode($deviceId) . '/pairing-code', ['phone' => $phone]);
    }

    /** @return array<string, mixed> */
    public function listGroups(string $deviceId): array
    {
        return $this->request('GET', '/devices/' . rawurlencode($deviceId) . '/groups');
    }

    // --- Webhooks ------------------------------------------------------------

    /** @return array<string, mixed> */
    public function listWebhooks(): array
    {
        return $this->request('GET', '/webhooks');
    }

    /**
     * @param array<string, mixed> $payload url (required), events?, secret?, retry_count?
     * @return array<string, mixed>
     */
    public function createWebhook(array $payload): array
    {
        return $this->request('POST', '/webhooks', $payload);
    }

    /** @return array<string, mixed> */
    public function getWebhook(int $id): array
    {
        return $this->request('GET', '/webhooks/' . $id);
    }

    /**
     * @param array<string, mixed> $payload any of url, events, active, secret, retry_count
     * @return array<string, mixed>
     */
    public function updateWebhook(int $id, array $payload): array
    {
        return $this->request('PUT', '/webhooks/' . $id, $payload);
    }

    /** @return array<string, mixed> */
    public function deleteWebhook(int $id): array
    {
        return $this->request('DELETE', '/webhooks/' . $id);
    }

    /** @return array<string, mixed> */
    public function regenerateWebhookSecret(int $id): array
    {
        return $this->request('POST', '/webhooks/' . $id . '/regenerate-secret');
    }

    /** @return array<string, mixed> */
    public function testWebhook(int $id): array
    {
        return $this->request('POST', '/webhooks/' . $id . '/test');
    }

    // --- Broadcast campaigns -------------------------------------------------

    /** @return array<string, mixed> */
    public function listCampaigns(int $page = 1): array
    {
        return $this->request('GET', '/broadcast/campaigns', null, ['page' => $page]);
    }

    /**
     * @param array<string, mixed> $payload name, message, contacts[], plus
     *        optional media_url, media_type, delay_seconds, schedule_at.
     * @return array<string, mixed>
     */
    public function createCampaign(array $payload): array
    {
        return $this->request('POST', '/broadcast/campaigns', $payload);
    }

    /** @return array<string, mixed> */
    public function getCampaign(string $campaignId): array
    {
        return $this->request('GET', '/broadcast/campaigns/' . rawurlencode($campaignId));
    }

    /** @return array<string, mixed> */
    public function sendCampaign(string $campaignId): array
    {
        return $this->request('POST', '/broadcast/campaigns/' . rawurlencode($campaignId) . '/send');
    }

    /** @return array<string, mixed> */
    public function pauseCampaign(string $campaignId): array
    {
        return $this->request('POST', '/broadcast/campaigns/' . rawurlencode($campaignId) . '/pause');
    }

    /** @return array<string, mixed> */
    public function resumeCampaign(string $campaignId): array
    {
        return $this->request('POST', '/broadcast/campaigns/' . rawurlencode($campaignId) . '/resume');
    }

    /** @return array<string, mixed> */
    public function deleteCampaign(string $campaignId): array
    {
        return $this->request('DELETE', '/broadcast/campaigns/' . rawurlencode($campaignId));
    }

    /**
     * List a campaign's contacts and per-contact status (paginated).
     * @return array<string, mixed>
     */
    public function getCampaignContacts(string $campaignId, ?string $status = null): array
    {
        return $this->request('GET', '/broadcast/campaigns/' . rawurlencode($campaignId) . '/contacts', null, $this->compact([
            'status' => $status,
        ]));
    }

    // --- IP whitelist --------------------------------------------------------

    /** @return array<string, mixed> */
    public function listIpWhitelist(): array
    {
        return $this->request('GET', '/ip-whitelist');
    }

    /** @return array<string, mixed> */
    public function addIp(string $ipAddress, ?string $label = null): array
    {
        return $this->request('POST', '/ip-whitelist', $this->compact([
            'ip_address' => $ipAddress,
            'label' => $label,
        ]));
    }

    /** @return array<string, mixed> */
    public function removeIp(int $id): array
    {
        return $this->request('DELETE', '/ip-whitelist/' . $id);
    }

    /** @return array<string, mixed> */
    public function setIpRestriction(bool $enabled): array
    {
        return $this->request('POST', '/ip-whitelist/toggle', ['enabled' => $enabled]);
    }

    // --- HTTP core -----------------------------------------------------------

    /**
     * Back-compat shortcut for a POST. `$path` is a relative path (preferred);
     * an absolute URL is accepted ONLY if it targets the configured base-URL
     * host (the API key is never sent off-host — see request()).
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function post(string $path, array $payload = []): array
    {
        return $this->request('POST', $path, $payload);
    }

    /**
     * @param array<string, mixed>|null $payload  null = no request body
     * @param array<string, mixed> $query
     * @return array<string, mixed>
     */
    protected function request(string $method, string $path, ?array $payload = null, array $query = []): array
    {
        // Resolve the target URL. An absolute URL is allowed only when its host
        // matches the configured base URL — otherwise we would attach the
        // Authorization: Bearer <api key> header to an arbitrary (possibly
        // attacker-supplied) host and leak the credential.
        if (preg_match('#^https?://#i', $path)) {
            $targetHost = parse_url($path, PHP_URL_HOST);
            $baseHost = parse_url($this->baseUrl, PHP_URL_HOST);
            if (! $targetHost || $baseHost === null || strcasecmp((string) $targetHost, (string) $baseHost) !== 0) {
                throw new ApiException('Refusing to send the API key to a host other than ' . $baseHost . ': ' . $path);
            }
            $url = $path;
        } else {
            $url = $this->baseUrl . $path;
        }

        $query = $this->compact($query);
        if ($query !== []) {
            $url .= (str_contains($url, '?') ? '&' : '?') . http_build_query($query);
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);

        $headers = ['Authorization: Bearer ' . $this->apiKey];
        if ($payload !== null) {
            $headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        if ($response === false) {
            throw new ApiException('cURL error: ' . curl_error($ch));
        }
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        // No curl_close(): it is a no-op since PHP 8.0 (deprecated in 8.5).
        // The CurlHandle is freed automatically when $ch goes out of scope.

        $data = json_decode((string) $response, true);

        if ($httpCode >= 400) {
            $message = 'HTTP ' . $httpCode;
            if (is_array($data)) {
                if (isset($data['message']) && is_string($data['message'])) {
                    $message = $data['message'];
                } elseif (isset($data['error']) && is_string($data['error'])) {
                    $message = $data['error'];
                }
            }
            throw new ApiException($message, $httpCode, is_array($data) ? $data : null);
        }

        return is_array($data) ? $data : ['raw' => $response];
    }

    /**
     * Drop entries whose value is null (so optional params are omitted).
     *
     * @param array<string, mixed> $arr
     * @return array<string, mixed>
     */
    protected function compact(array $arr): array
    {
        return array_filter($arr, static fn ($v) => $v !== null);
    }
}
