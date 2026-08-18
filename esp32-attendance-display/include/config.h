#ifndef CONFIG_H
#define CONFIG_H

// ================= WiFi =================
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// ================= Server =================
// URL of the Next.js app (no trailing slash)
#define SERVER_BASE_URL "http://192.168.1.100:3000"

// Device identity — must match a registered device in the web app (Devices page)
#define DEVICE_ID       "DEVICE-001"
#define DEVICE_API_KEY  "PASTE-THE-DEVICE-API-KEY-HERE"

// ================= LCD =================
// 16x2 I2C LCD. Common PCF8574 backpack addresses: 0x27 or 0x3F.
#define LCD_ADDRESS     0x27
#define LCD_COLUMNS     16
#define LCD_ROWS        2

// ESP32-S3 default I2C pins:
//   SDA -> GPIO 8, SCL -> GPIO 9
#define I2C_SDA_PIN     8
#define I2C_SCL_PIN     9

// ================= Timing (defaults; server can override via commands) =====
#define STUDENT_DISPLAY_MS   4000   // how long each student stays on screen
#define LCD_TRANSITION_MS    500    // blank delay between screens
#define SUCCESS_DISPLAY_MS   3000   // "Attendance Successful!" duration
#define READY_DISPLAY_MS     3000   // "Ready / Next Class" duration
#define COMMAND_POLL_MS      2000   // poll interval while active
#define HEARTBEAT_MS         30000  // heartbeat interval
#define WIFI_TIMEOUT_MS      20000  // WiFi connect timeout

// ================= Firmware =================
#define FIRMWARE_VERSION "1.0.0"

#endif // CONFIG_H
