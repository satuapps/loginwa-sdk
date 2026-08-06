package com.loginwa.sdk.models

data class StartOtpRequest(
    val phone: String,
    val countryCode: String? = null,
    val otpLength: Int? = null,
    val messageTemplate: String? = null,
    val meta: Map<String, Any>? = null,
)

data class StartOtpResponse(
    val success: Boolean,
    val message: String?,
    val sessionId: String?,
    val expiresIn: Long?,
    val sentViaEngine: Boolean,
)

data class VerifyOtpRequest(
    val sessionId: String,
    val otpCode: String,
)

data class VerifyOtpResponse(
    val status: String?,
    val phone: String?,
    val verifiedAt: String?,
    val message: String?,
)

sealed class LoginWAException(message: String?, cause: Throwable? = null) : Exception(message, cause)
class HttpError(val status: Int, val code: String?, val rawBody: String?) : LoginWAException("HTTP $status${code?.let { " ($it)" } ?: ""}")
class NetworkError(cause: Throwable) : LoginWAException("Network error", cause)
class SerializationError(message: String, cause: Throwable) : LoginWAException(message, cause)
