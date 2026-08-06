plugins {
    id("com.android.application") version "8.1.4"
    id("org.jetbrains.kotlin.android") version "1.9.24"
}

android {
    namespace = "com.loginwa.sample"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.loginwa.sample"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "0.1"
        val apiKey: String = (project.findProperty("LOGINWA_API_KEY") as? String) ?: "CHANGE_ME"
        buildConfigField("String", "LOGINWA_API_KEY", "\"$apiKey\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(project(":library"))
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
