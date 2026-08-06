<?php

namespace LoginWA\SDK;

/**
 * Thrown for any non-2xx API response. `getCode()` is the HTTP status code
 * and `$data` holds the decoded JSON error body (when present).
 */
class ApiException extends \RuntimeException
{
    /** @var array<string, mixed>|null */
    public ?array $data = null;

    /**
     * @param array<string, mixed>|null $data
     */
    public function __construct(string $message, int $code = 0, ?array $data = null)
    {
        parent::__construct($message, $code);
        $this->data = $data;
    }
}
