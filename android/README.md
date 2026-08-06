# LoginWA Android SDK (Kotlin)

Lightweight REST client for LoginWA OTP API on Android. Provides suspend functions to start and verify OTP over WhatsApp.

## Installation (when published to Maven Central)
```kotlin
dependencies {
    implementation("com.loginwa:loginwa-otp:0.1.0")
}
```

For local development (this repo):
1) Open `sdk/android` in Android Studio.
2) Use the `library` module as a local dependency or publish to a local maven repo (`./gradlew publishToMavenLocal` after adding a publish task).

## Usage
```kotlin
val client = LoginWAClient(
    apiKey = BuildConfig.LOGINWA_API_KEY,
    baseUrl = "https://api.loginwa.com/api/v1", // override if needed
    enableLogging = true
)

// start OTP
override suspend fun start() {
    val start = client.startOtp(StartOtpRequest(phone = "6281234567890", countryCode = "62"))
    // save start.sessionId and show input for OTP
}

// verify OTP
override suspend fun verify(sessionId: String, code: String) {
    val result = client.verifyOtp(VerifyOtpRequest(sessionId, code))
    if (result.status == "verified") {
        // success
    }
}
```

## Errors
- `HttpError(status, code, rawBody)` — non-2xx HTTP. `code` comes from API JSON if present.
- `NetworkError` — connectivity/timeouts.
- `SerializationError` — unexpected/invalid JSON.

## Configuration
- `apiKey` (required): Secret API key (store securely; do not hardcode in source).
- `baseUrl` (optional): default `https://api.loginwa.com/api/v1`.
- `timeoutSeconds` (optional): default 15s.
- `enableLogging` (optional): OkHttp BASIC logging (no headers/body).
- `clientBuilder` (optional): inject custom OkHttp settings (cert pinning, interceptors, etc.).

## Sample app (planned)
Sample app lives under `sdk/android/sample` (simple Activity with phone + OTP form). Set `LOGINWA_API_KEY` in `~/.gradle/gradle.properties`, open project in Android Studio, run the `:sample` module.

## License
MIT
