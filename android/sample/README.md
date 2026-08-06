# LoginWA Android Sample App

Minimal sample using `LoginWAClient` to start and verify OTP. Contains a simple UI with phone, country code, session, and OTP inputs.

## Run
1) Open `sdk/android` in Android Studio.
2) Set your API key (recommended via `LOGINWA_API_KEY` in `~/.gradle/gradle.properties`):
   ```
   LOGINWA_API_KEY=your_api_key_here
   ```
3) Select the `sample` run configuration (module `:sample`) and run on a device/emulator.

Notes:
- Base URL defaults to `https://api.loginwa.com/api/v1`.
- Logging is enabled in the sample; avoid shipping with verbose logging in production.
