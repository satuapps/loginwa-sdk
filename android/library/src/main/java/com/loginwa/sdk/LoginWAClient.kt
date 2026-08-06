package com.loginwa.sdk

import com.loginwa.sdk.models.StartOtpRequest
import com.loginwa.sdk.models.StartOtpResponse
import com.loginwa.sdk.models.VerifyOtpRequest
import com.loginwa.sdk.models.VerifyOtpResponse
import com.loginwa.sdk.models.LoginWAException
import com.loginwa.sdk.models.HttpError
import com.loginwa.sdk.models.NetworkError
import com.loginwa.sdk.models.SerializationError
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class LoginWAClient @JvmOverloads constructor(
    private val apiKey: String,
    private val baseUrl: String = DEFAULT_BASE_URL,
    timeoutSeconds: Long = 15,
    enableLogging: Boolean = false,
    clientBuilder: (OkHttpClient.Builder.() -> Unit)? = null,
) {
    private val client: OkHttpClient
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    init {
        val builder = OkHttpClient.Builder()
            .callTimeout(timeoutSeconds, TimeUnit.SECONDS)
            .connectTimeout(timeoutSeconds, TimeUnit.SECONDS)
            .readTimeout(timeoutSeconds, TimeUnit.SECONDS)

        if (enableLogging) {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
            builder.addInterceptor(logging)
        }

        clientBuilder?.invoke(builder)
        client = builder.build()
    }

    suspend fun startOtp(request: StartOtpRequest): StartOtpResponse = withContext(Dispatchers.IO) {
        val url = "$baseUrl/auth/start"
        val bodyJson = JSONObject().apply {
            put("phone", request.phone)
            request.countryCode?.let { put("country_code", it) }
            request.otpLength?.let { put("otp_length", it) }
            request.messageTemplate?.let { put("message_template", it) }
            request.meta?.let { put("meta", JSONObject(it)) }
        }

        val httpRequest = Request.Builder()
            .url(url)
            .post(bodyJson.toString().toRequestBody(jsonMediaType))
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("Content-Type", "application/json")
            .build()

        executeStart(httpRequest)
    }

    suspend fun verifyOtp(request: VerifyOtpRequest): VerifyOtpResponse = withContext(Dispatchers.IO) {
        val url = "$baseUrl/auth/verify"
        val bodyJson = JSONObject().apply {
            put("session_id", request.sessionId)
            put("otp_code", request.otpCode)
        }

        val httpRequest = Request.Builder()
            .url(url)
            .post(bodyJson.toString().toRequestBody(jsonMediaType))
            .addHeader("Authorization", "Bearer $apiKey")
            .addHeader("Content-Type", "application/json")
            .build()

        executeVerify(httpRequest)
    }

    private fun executeStart(httpRequest: Request): StartOtpResponse {
        try {
            client.newCall(httpRequest).execute().use { response ->
                val body = response.body?.string()
                if (!response.isSuccessful) {
                    throw HttpError(response.code, codeFrom(body), body)
                }
                val json = JSONObject(body ?: "{}")
                val sessionId = json.optString("session_id", null)?.takeIf { it.isNotBlank() }
                return StartOtpResponse(
                    success = sessionId != null,
                    message = json.optString("message", null)?.takeIf { it.isNotBlank() },
                    sessionId = sessionId,
                    expiresIn = json.optLong("expires_in", 0L).takeIf { it > 0 },
                    sentViaEngine = json.optBoolean("sent_via_engine", false),
                )
            }
        } catch (e: HttpError) {
            throw e
        } catch (e: IOException) {
            throw NetworkError(e)
        } catch (e: Exception) {
            throw SerializationError("Failed to parse startOtp response", e)
        }
    }

    private fun executeVerify(httpRequest: Request): VerifyOtpResponse {
        try {
            client.newCall(httpRequest).execute().use { response ->
                val body = response.body?.string()
                if (!response.isSuccessful) {
                    throw HttpError(response.code, codeFrom(body), body)
                }
                val json = JSONObject(body ?: "{}")
                val phone = json.optString("phone", null)?.takeIf { it.isNotBlank() }
                    ?: json.optString("phone_number", null)?.takeIf { it.isNotBlank() }
                return VerifyOtpResponse(
                    status = json.optString("status", null)?.takeIf { it.isNotBlank() },
                    phone = phone,
                    verifiedAt = json.optString("verified_at", null)?.takeIf { it.isNotBlank() },
                    message = json.optString("message", null)?.takeIf { it.isNotBlank() }
                )
            }
        } catch (e: HttpError) {
            throw e
        } catch (e: IOException) {
            throw NetworkError(e)
        } catch (e: Exception) {
            throw SerializationError("Failed to parse verifyOtp response", e)
        }
    }

    private fun codeFrom(body: String?): String? {
        if (body.isNullOrBlank()) return null
        return try {
            val json = JSONObject(body)
            sequenceOf("error", "status", "code")
                .mapNotNull { key -> json.optString(key, null)?.takeIf { it.isNotBlank() } }
                .firstOrNull()
        } catch (_: Exception) {
            null
        }
    }

    companion object {
        const val DEFAULT_BASE_URL = "https://api.loginwa.com/api/v1"
    }
}
