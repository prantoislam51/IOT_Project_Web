# ESP32-S3 Attendance Display Firmware

Firmware for the ESP32-S3 N16R8 that drives a **16×2 I2C LCD** to show live attendance status.

## Hardware

| Component | Spec |
|-----------|------|
| MCU | ESP32-S3 N16R8 (16 MB flash, 8 MB PSRAM) |
| Display | 16×2 HD44780 LCD with PCF8574 I2C backpack |
| I2C address | **0x27** (or 0x3F — see `include/config.h`) |

## Wiring (ESP32-S3 → LCD)

| LCD Pin | ESP32-S3 Pin | Notes |
|---------|---------------|-------|
| SDA | GPIO 8 | (change in `config.h` if needed) |
| SCL | GPIO 9 | |
| VCC | 3.3 V | Most PCF8574 backpacks accept 3.3 V logic |
| GND | GND | |

> **Important:** Verify your LCD module's voltage tolerance before connecting.
> Some 5 V I2C modules may need a logic-level shifter.

## Setup

### 1. Install PlatformIO

```bash
curl -fsSL https://raw.githubusercontent.com/platformio/platformio-core-installer/master/get-platformio.py | python3 -
```

Or via VS Code — install the **PlatformIO IDE** extension.

### 2. Configure WiFi & Server

Edit `include/config.h`:

```c
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"
#define SERVER_BASE_URL "http://192.168.1.100:3000"   // your Next.js app
#define DEVICE_ID       "DEVICE-001"                   // must match web app
#define DEVICE_API_KEY  "paste-key-here"               // from Devices page
```

### 3. Build & Upload

```bash
cd esp32-attendance-display
pio run -t upload
```

### 4. Monitor Serial Output

```bash
pio device monitor
```

## State Machine

```
BOOT → CONNECTING_WIFI → READY → ATTENDANCE_DISPLAY → SUCCESS → READY
                         ↑                                            ↓
                         └──────── OFFLINE ← ERROR ←─────────────────┘
```

| State | LCD Shows |
|-------|-----------|
| BOOT | `Smart Attendance` / `Booting...` |
| CONNECTING_WIFI | `Connecting` / `WiFi...` |
| READY | `Ready` / `Next Class` |
| ATTENDANCE_DISPLAY | Student name (scrolling) / `Present` or `Absent` |
| SUCCESS | `Attendance` / `Successful!` |
| OFFLINE | `Reconnecting` / `WiFi...` |

## Display Features

- Names longer than 16 characters scroll automatically
- Student display duration is configurable (default 4 s)
- Server can override all timing settings via command polling
- WiFi auto-reconnects after drops
- HTTP polling for commands (no WebSocket required)