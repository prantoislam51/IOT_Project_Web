/**
 * Smart Attendance IoT Display Client
 * -----------------------------------------------------------------------------
 * ESP32-S3 N16R8 + 16x2 I2C LCD
 *
 * Responsibilities:
 *   - Connect to WiFi (with auto-reconnect)
 *   - Send heartbeat to the server every 30s
 *   - Poll pending device commands every ~2s
 *   - On ATTENDANCE_STARTED: fetch the active session and display each
 *     student + status sequentially on the LCD (scrolling long names)
 *   - On ATTENDANCE_COMPLETED: show "Attendance / Successful!" then return
 *     to Ready state
 *   - Recover from WiFi drops and API failures without rebooting
 *
 * State machine: BOOT -> CONNECTING_WIFI -> READY -> ATTENDANCE_DISPLAY
 *                -> SUCCESS -> READY   (ERROR / OFFLINE are transient)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "lcd_display.h"

// ---------------------------------------------------------------------------
// LCD
// ---------------------------------------------------------------------------
LcdDisplay lcd;

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------
enum class State {
    BOOT,
    CONNECTING_WIFI,
    READY,
    ATTENDANCE_DISPLAY,
    SUCCESS,
    ERROR,
    OFFLINE
};

const char* stateName(State s) {
    switch (s) {
        case State::BOOT:                return "BOOT";
        case State::CONNECTING_WIFI:     return "CONNECTING_WIFI";
        case State::READY:               return "READY";
        case State::ATTENDANCE_DISPLAY:  return "ATTENDANCE_DISPLAY";
        case State::SUCCESS:             return "SUCCESS";
        case State::ERROR:               return "ERROR";
        case State::OFFLINE:             return "OFFLINE";
    }
    return "UNKNOWN";
}

State state = State::BOOT;

// ---------------------------------------------------------------------------
// Runtime configuration (server may override defaults)
// ---------------------------------------------------------------------------
uint32_t studentDisplayMs = STUDENT_DISPLAY_MS;
uint32_t transitionMs     = LCD_TRANSITION_MS;
uint32_t successMs        = SUCCESS_DISPLAY_MS;
uint32_t readyMs          = READY_DISPLAY_MS;
uint32_t pollMs           = COMMAND_POLL_MS;

// ---------------------------------------------------------------------------
// Timing trackers
// ---------------------------------------------------------------------------
unsigned long lastHeartbeat = 0;
unsigned long lastPoll      = 0;
unsigned long stateEnteredMs = 0;
unsigned long lastDeviceQueryMs = 0;

// Attendance data being displayed
struct StudentEntry {
    String studentId;
    String name;
    String status; // "PRESENT" | "ABSENT" | ""
};
StudentEntry students[24];
int    studentCount  = 0;
int    currentStudent = 0;
String activeSessionId = "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
void setState(State s) {
    Serial.printf("[STATE] %s -> %s\n", stateName(state), stateName(s));
    state = s;
    stateEnteredMs = millis();
}

bool wifiConnected() { return WiFi.status() == WL_CONNECTED; }

void connectWiFi() {
    lcd.showScreen("Connecting", "WiFi...");
    Serial.printf("[WiFi] Connecting to %s\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_TIMEOUT_MS) {
        delay(250);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[WiFi] Connected, IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("[WiFi] Failed to connect");
    }
}

String apiPath(const char* suffix) {
    return String(SERVER_BASE_URL) + "/api/devices/" + DEVICE_ID + suffix;
}

// ---------------------------------------------------------------------------
// HTTP request helper with API-key auth. Returns HTTP code, fills payload.
// ---------------------------------------------------------------------------
int httpGet(const String& url, String& response) {
    HTTPClient http;
    http.setReuse(false);
    http.setTimeout(8000);
    http.begin(url);
    http.addHeader("x-api-key", DEVICE_API_KEY);
    int code = http.GET();
    if (code == HTTP_CODE_OK) response = http.getString();
    http.end();
    return code;
}

int httpPost(const String& url, const String& body, String& response) {
    HTTPClient http;
    http.setReuse(false);
    http.setTimeout(8000);
    http.begin(url);
    http.addHeader("x-api-key", DEVICE_API_KEY);
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(body);
    if (code > 0) response = http.getString();
    http.end();
    return code;
}

// ---------------------------------------------------------------------------
// Server communication
// ---------------------------------------------------------------------------
void sendHeartbeat() {
    String body = "{\"ip\":\"" + WiFi.localIP().toString() +
                  "\",\"firmwareVersion\":\"" FIRMWARE_VERSION "\"" +
                  ",\"state\":\"" + String(stateName(state)) + "\"}";
    String resp;
    int code = httpPost(apiPath("/heartbeat"), body, resp);
    if (code == 200) {
        Serial.println("[Heartbeat] OK");
    } else {
        Serial.printf("[Heartbeat] failed (%d)\n", code);
    }
}

bool fetchAttendance(const String& sessionId) {
    String url = apiPath("/attendance");
    if (sessionId.length() > 0) url += "?sessionId=" + sessionId;

    String response;
    int code = httpGet(url, response);
    if (code != 200) {
        Serial.printf("[Attendance] fetch failed (%d)\n", code);
        return false;
    }

    JsonDocument doc;
    if (deserializeJson(doc, response)) {
        Serial.println("[Attendance] JSON parse error");
        return false;
    }

    if (!doc["success"].as<bool>() || doc["data"]["session"].isNull()) {
        return false;
    }

    JsonObject session = doc["data"]["session"];
    activeSessionId = session["id"].as<String>();
    JsonArray arr = session["students"].as<JsonArray>();

    studentCount = 0;
    for (JsonObject stu : arr) {
        if (studentCount >= 24) break;
        students[studentCount].studentId = stu["studentId"].as<String>();
        students[studentCount].name      = stu["name"].as<String>();
        students[studentCount].status    = stu["status"].as<String>();
        studentCount++;
    }
    Serial.printf("[Attendance] loaded %d students (session %s)\n",
                  studentCount, activeSessionId.c_str());
    return studentCount > 0;
}

void acknowledgeCommand(const String& commandType) {
    String body = "{\"commandType\":\"" + commandType + "\",\"sessionId\":\"" + activeSessionId + "\"}";
    String resp;
    httpPost(apiPath("/acknowledge"), body, resp);
}

void processCommands() {
    String response;
    int code = httpGet(apiPath("/commands"), response);
    if (code != 200) return;

    JsonDocument doc;
    if (deserializeJson(doc, response)) return;
    if (!doc["success"].as<bool>()) return;

    // Apply server-side display config overrides if present
    JsonObject cfg = doc["data"]["config"];
    if (!cfg.isNull()) {
        studentDisplayMs = cfg["studentDisplaySeconds"].as<uint32_t>() * 1000;
        transitionMs     = cfg["lcdTransitionMs"].as<uint32_t>();
        successMs        = cfg["successDurationSeconds"].as<uint32_t>() * 1000;
        readyMs          = cfg["readyDurationSeconds"].as<uint32_t>() * 1000;
    }

    JsonArray commands = doc["data"]["commands"].as<JsonArray>();
    for (JsonObject cmd : commands) {
        String type = cmd["type"].as<String>();
        String sessionId = cmd["sessionId"].as<String>();
        Serial.printf("[Command] %s (session %s)\n", type.c_str(), sessionId.c_str());

        if (type == "ATTENDANCE_STARTED") {
            activeSessionId = sessionId;
            if (fetchAttendance(sessionId)) {
                currentStudent = 0;
                acknowledgeCommand(type);
                lcd.clear();
                lcd.showScreen(sessionId.length() ? "Attendance" : "Attendance", "Starting...");
                delay(transitionMs);
                setState(State::ATTENDANCE_DISPLAY);
            }
        } else if (type == "ATTENDANCE_COMPLETED") {
            activeSessionId = sessionId;
            acknowledgeCommand(type);
            lcd.clear();
            lcd.showScreen("Attendance", "Successful!");
            setState(State::SUCCESS);
        } else if (type == "DISPLAY_MESSAGE") {
            String msg = cmd["message"].as<String>();
            acknowledgeCommand(type);
            lcd.clear();
            lcd.showScreen("Message", msg);
        } else if (type == "RESTART") {
            acknowledgeCommand(type);
            ESP.restart();
        }
    }
}

// ---------------------------------------------------------------------------
// Display cycle for the active attendance session
// ---------------------------------------------------------------------------
void displayAttendanceCycle() {
    if (studentCount == 0) return;

    StudentEntry& s = students[currentStudent];
    String line2 = (s.status == "PRESENT") ? "Present" : (s.status == "ABSENT" ? "Absent" : "-----");
    lcd.clear();
    lcd.showStudent(s.name, line2);

    unsigned long start = millis();
    while (millis() - start < studentDisplayMs) {
        lcd.service(); // scroll long names
        delay(50);

        // Keep polling for completion while displaying
        if (millis() - lastPoll >= pollMs) {
            lastPoll = millis();
            String response;
            if (httpGet(apiPath("/commands"), response) == 200) {
                JsonDocument doc;
                if (!deserializeJson(doc, response) && doc["success"].as<bool>()) {
                    JsonArray commands = doc["data"]["commands"].as<JsonArray>();
                    for (JsonObject cmd : commands) {
                        if (cmd["type"].as<String>() == "ATTENDANCE_COMPLETED") {
                            activeSessionId = cmd["sessionId"].as<String>();
                            acknowledgeCommand("ATTENDANCE_COMPLETED");
                            lcd.clear();
                            lcd.showScreen("Attendance", "Successful!");
                            setState(State::SUCCESS);
                            return;
                        }
                    }
                }
            }
        }
    }

    delay(transitionMs);
    currentStudent++;

    // After showing all students, refresh statuses and restart the cycle
    if (currentStudent >= studentCount) {
        currentStudent = 0;
        if (millis() - lastDeviceQueryMs > 15000) {
            lastDeviceQueryMs = millis();
            fetchAttendance(activeSessionId); // pick up teacher's latest marks
        }
    }
}

// ---------------------------------------------------------------------------
// Setup / Loop
// ---------------------------------------------------------------------------
void setup() {
    Serial.begin(115200);
    delay(300);
    Serial.println("\n=== Smart Attendance Display ===");
    Serial.printf("Firmware %s | Device %s\n", FIRMWARE_VERSION, DEVICE_ID);

    lcd.begin();
    lcd.showScreen("Smart Attendance", "Booting...");
    setState(State::BOOT);
    delay(1200);

    setState(State::CONNECTING_WIFI);
    connectWiFi();

    if (wifiConnected()) {
        sendHeartbeat();
        lcd.showScreen("Ready", "Next Class");
        setState(State::READY);
    } else {
        lcd.showScreen("WiFi Failed", "Check config");
        setState(State::OFFLINE);
    }
}

void loop() {
    unsigned long now = millis();

    // ---- WiFi auto-reconnect ----
    if (!wifiConnected()) {
        if (state != State::OFFLINE) {
            lcd.showScreen("Reconnecting", "WiFi...");
            setState(State::OFFLINE);
        }
        WiFi.reconnect();
        delay(1000);
        if (wifiConnected()) {
            lcd.showScreen("Ready", "Next Class");
            setState(State::READY);
        }
        return;
    }

    // ---- Heartbeat ----
    if (now - lastHeartbeat >= HEARTBEAT_MS) {
        lastHeartbeat = now;
        sendHeartbeat();
    }

    // ---- State machine ----
    switch (state) {
        case State::READY:
            lcd.service();
            if (now - lastPoll >= pollMs) {
                lastPoll = now;
                processCommands();
            }
            break;

        case State::ATTENDANCE_DISPLAY:
            displayAttendanceCycle();
            break;

        case State::SUCCESS:
            if (now - stateEnteredMs >= successMs) {
                lcd.clear();
                lcd.showScreen("Ready", "Next Class");
                delay(readyMs);
                lcd.clear();
                lcd.showScreen("Ready", "Next Class");
                studentCount = 0;
                currentStudent = 0;
                setState(State::READY);
            }
            break;

        case State::OFFLINE:
        case State::ERROR:
            // handled by the reconnect logic above
            break;

        case State::BOOT:
        case State::CONNECTING_WIFI:
            setState(wifiConnected() ? State::READY : State::OFFLINE);
            break;
    }

    delay(20);
}
