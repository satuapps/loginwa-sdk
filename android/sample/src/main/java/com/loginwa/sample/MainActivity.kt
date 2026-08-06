package com.loginwa.sample

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.loginwa.sdk.LoginWAClient
import com.loginwa.sdk.models.LoginWAException
import com.loginwa.sdk.models.StartOtpRequest
import com.loginwa.sdk.models.VerifyOtpRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private val client by lazy {
        LoginWAClient(
            apiKey = BuildConfig.LOGINWA_API_KEY,
            baseUrl = "https://api.loginwa.com/api/v1",
            enableLogging = true,
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val inputPhone: EditText = findViewById(R.id.inputPhone)
        val inputCountry: EditText = findViewById(R.id.inputCountry)
        val inputSession: EditText = findViewById(R.id.inputSession)
        val inputCode: EditText = findViewById(R.id.inputCode)
        val textStatus: TextView = findViewById(R.id.textStatus)
        val btnStart: Button = findViewById(R.id.btnStart)
        val btnVerify: Button = findViewById(R.id.btnVerify)

        btnStart.setOnClickListener {
            val phone = inputPhone.text?.toString()?.trim().orEmpty()
            val country = inputCountry.text?.toString()?.trim().takeIf { it?.isNotEmpty() == true }
            if (phone.isEmpty()) {
                textStatus.text = "Status: phone required"
                return@setOnClickListener
            }
            lifecycleScope.launch {
                textStatus.text = "Status: starting..."
                try {
                    val result = withContext(Dispatchers.IO) {
                        client.startOtp(StartOtpRequest(phone = phone, countryCode = country))
                    }
                    inputSession.setText(result.sessionId ?: "")
                    textStatus.text = "Status: OTP sent (session=${result.sessionId})"
                } catch (e: LoginWAException) {
                    textStatus.text = "Error: ${e.message}"
                } catch (e: Exception) {
                    textStatus.text = "Error: ${e.message}"
                }
            }
        }

        btnVerify.setOnClickListener {
            val sessionId = inputSession.text?.toString()?.trim().orEmpty()
            val code = inputCode.text?.toString()?.trim().orEmpty()
            if (sessionId.isEmpty() || code.isEmpty()) {
                textStatus.text = "Status: session/code required"
                return@setOnClickListener
            }
            lifecycleScope.launch {
                textStatus.text = "Status: verifying..."
                try {
                    val result = withContext(Dispatchers.IO) {
                        client.verifyOtp(VerifyOtpRequest(sessionId, code))
                    }
                    textStatus.text = "Verified: status=${result.status}, phone=${result.phone}"
                } catch (e: LoginWAException) {
                    textStatus.text = "Error: ${e.message}"
                } catch (e: Exception) {
                    textStatus.text = "Error: ${e.message}"
                }
            }
        }
    }
}
