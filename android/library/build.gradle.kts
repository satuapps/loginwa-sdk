import java.util.Properties

plugins {
    id("com.android.library") version "8.1.4"
    id("org.jetbrains.kotlin.android") version "1.9.24"
    id("maven-publish")
    id("signing")
}

group = (findProperty("POM_GROUP_ID") as String?) ?: "com.loginwa"
version = (findProperty("VERSION_NAME") as String?) ?: "0.1.0"

android {
    namespace = "com.loginwa.sdk"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
        targetSdk = 34
        consumerProguardFiles("consumer-rules.pro")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    // Enable sources artifact for publishing
    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
}

afterEvaluate {
    val isSnapshot = version.toString().endsWith("SNAPSHOT")
    val ossrhUsername = findProperty("OSSRH_USERNAME") as String?
    val ossrhPassword = findProperty("OSSRH_PASSWORD") as String?

    publishing {
        publications {
            create<MavenPublication>("release") {
                from(components["release"])
                groupId = project.group.toString()
                artifactId = (findProperty("POM_ARTIFACT_ID") as String?) ?: "loginwa-otp"
                version = project.version.toString()

                pom {
                    name.set(findProperty("POM_NAME") as String? ?: "LoginWA OTP Android SDK")
                    description.set(findProperty("POM_DESCRIPTION") as String? ?: "Lightweight Kotlin client for LoginWA OTP API over WhatsApp")
                    url.set(findProperty("POM_URL") as String? ?: "https://github.com/satuapps/loginwa-sdk")
                    licenses {
                        license {
                            name.set(findProperty("POM_LICENSE_NAME") as String? ?: "MIT")
                            url.set(findProperty("POM_LICENSE_URL") as String? ?: "https://opensource.org/licenses/MIT")
                        }
                    }
                    developers {
                        developer {
                            name.set(findProperty("POM_DEVELOPER_NAME") as String? ?: "LoginWA")
                            email.set(findProperty("POM_DEVELOPER_EMAIL") as String? ?: "dev@loginwa.com")
                        }
                    }
                    scm {
                        url.set(findProperty("POM_SCM_URL") as String? ?: "https://github.com/satuapps/loginwa-sdk")
                    }
                }
            }
        }
        repositories {
            maven {
                name = "ossrh"
                url = uri(
                    if (isSnapshot) {
                        "https://s01.oss.sonatype.org/content/repositories/snapshots/"
                    } else {
                        "https://s01.oss.sonatype.org/service/local/staging/deploy/maven2/"
                    }
                )
                credentials {
                    username = ossrhUsername
                    password = ossrhPassword
                }
            }
        }
    }

    signing {
        val signingKeyId = findProperty("SIGNING_KEY_ID") as String?
        val signingKey = findProperty("SIGNING_KEY") as String?
        val signingPassword = findProperty("SIGNING_PASSWORD") as String?

        if (!signingKey.isNullOrBlank()) {
            useInMemoryPgpKeys(signingKeyId, signingKey, signingPassword)
            sign(publishing.publications["release"])
        }
    }
}
