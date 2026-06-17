/*
 * Universal Racing Sensor Board v0.5 — Teensy 4.1 Firmware
 *
 * Reads all sensors, builds a JSON packet, sends it via UDP at 50 Hz.
 * The RPi backend (udp_receiver.py) listens on port 5005.
 *
 * Hardware: Teensy 4.1 + WIZ850io (W5500) + 8× MAX31855 + LIS3DH (I2C)
 *           + GPS NEO-6M (Serial8) + 4× MOSFET + NeoPixel via 74AHCT125D
 *
 * Libraries needed (install via Arduino Library Manager or PlatformIO):
 *   - Ethernet            (for W5500 — see SPI1 NOTE below)
 *   - Adafruit MAX31855   (thermocouple SPI ADC)
 *   - Adafruit LIS3DH     (accelerometer I2C)
 *   - TinyGPSPlus         (NMEA parsing)
 *   - Adafruit NeoPixel   (WS2812B LED strip)
 *
 * SPI1 NOTE: The WIZ850io is wired to SPI1 (p26 MOSI, p1 MISO, p27 SCK, p0 CS).
 * The standard Ethernet library uses SPI0 by default. You have two options:
 *   A) Use a Teensy-compatible Ethernet fork that supports SPI1
 *   B) Bodge-wire WIZ850io to SPI0 pins (p11/p12/p13) and share the bus with MAX31855
 * Option B works fine — SPI is a bus, each device has its own CS. Set ETH_USE_SPI1 = 0.
 */

#include <SPI.h>
#include <Wire.h>
#include <Ethernet.h>
#include <EthernetUdp.h>
#include <Adafruit_MAX31855.h>
#include <Adafruit_LIS3DH.h>
#include <Adafruit_NeoPixel.h>
#include <TinyGPSPlus.h>

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION — edit these for your setup
// ═══════════════════════════════════════════════════════════════════════════

// Network
static byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE };
static IPAddress teensy_ip(192, 168, 1, 100);
static IPAddress rpi_ip(192, 168, 1, 10);
static const uint16_t UDP_PORT = 5005;

// Timing
static const uint32_t LOOP_INTERVAL_US = 20000;  // 50 Hz = 20 ms
static const uint32_t LED_BLINK_MS     = 500;    // heartbeat toggle

// RPM: pulses per revolution (4-cyl, single coil, distributor = 2)
static const float RPM_PULSES_PER_REV = 2.0f;

// Analog scaling: 10k/15k divider → 5V sensor reads as 3.0V at ADC
// Teensy 4.1 ADC: 10-bit default (0–1023), 3.3V reference
// Vpin = Vsensor × 15k / (10k + 15k) = Vsensor × 0.6
// Vsensor = Vpin / 0.6 = (adc / 1023 × 3.3) / 0.6
static const float ANA_SCALE = 3.3f / 1023.0f / 0.6f;  // ADC count → volts (0–5V)

// NTC: 10kΩ pull-up to 3.3V, 10kΩ NTC
// R_ntc = 10000 × adc / (1023 - adc)
// Steinhart-Hart coefficients for generic 10kΩ NTC (B=3950)
static const float NTC_B = 3950.0f;
static const float NTC_R0 = 10000.0f;
static const float NTC_T0 = 298.15f;  // 25°C in Kelvin

// NeoPixel
static const uint16_t NEO_NUM_LEDS = 16;  // adjust for your strip

// MOSFET auto-control thresholds (set to 0 to disable auto-control)
static const float FAN_ON_TEMP  = 105.0f;  // oil temp °C → turn on fan relay
static const float FAN_OFF_TEMP =  95.0f;  // hysteresis

// ═══════════════════════════════════════════════════════════════════════════
// PIN DEFINITIONS — match v0.5 PCB
// ═══════════════════════════════════════════════════════════════════════════

// SPI0 chip selects (active low)
static const uint8_t CS_TC0 = 10;  // MAX31855 #0
static const uint8_t CS_TC1 =  9;
static const uint8_t CS_TC2 =  8;
static const uint8_t CS_TC3 =  7;
static const uint8_t CS_TC4 =  6;
static const uint8_t CS_TC5 =  5;
static const uint8_t CS_TC6 =  4;
static const uint8_t CS_TC7 =  3;

// SPI1 / Ethernet
static const uint8_t CS_ETH  = 0;
static const uint8_t INT_ETH = 28;
static const uint8_t RST_ETH = 29;

// Analog inputs
static const uint8_t PIN_ANA1 = 14;  // A0
static const uint8_t PIN_ANA2 = 15;  // A1
static const uint8_t PIN_NTC1 = 22;  // A8
static const uint8_t PIN_NTC2 = 23;  // A9
static const uint8_t PIN_NTC3 = 24;  // A10
static const uint8_t PIN_NTC4 = 25;  // A11

// Digital inputs
static const uint8_t PIN_RPM  = 30;
static const uint8_t PIN_DIG1 = 31;
static const uint8_t PIN_DIG2 = 32;
static const uint8_t PIN_DIG3 = 33;

// MOSFET outputs
static const uint8_t PIN_MOS1 = 37;  // fan relay
static const uint8_t PIN_MOS2 = 38;  // fuel pump relay
static const uint8_t PIN_MOS3 = 39;  // shift light
static const uint8_t PIN_MOS4 = 40;  // spare

// NeoPixel + Status LED
static const uint8_t PIN_NEO = 36;
static const uint8_t PIN_LED =  2;

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL OBJECTS
// ═══════════════════════════════════════════════════════════════════════════

// Thermocouple ADCs (all share SPI0 MOSI/MISO/SCK, individual CS)
static const uint8_t tc_cs[] = { CS_TC0, CS_TC1, CS_TC2, CS_TC3,
                                  CS_TC4, CS_TC5, CS_TC6, CS_TC7 };
Adafruit_MAX31855 tc[8] = {
    Adafruit_MAX31855(CS_TC0), Adafruit_MAX31855(CS_TC1),
    Adafruit_MAX31855(CS_TC2), Adafruit_MAX31855(CS_TC3),
    Adafruit_MAX31855(CS_TC4), Adafruit_MAX31855(CS_TC5),
    Adafruit_MAX31855(CS_TC6), Adafruit_MAX31855(CS_TC7),
};

// Accelerometer (I2C, addr 0x18)
Adafruit_LIS3DH lis = Adafruit_LIS3DH();

// GPS (Serial8: RX=p34, TX=p35)
TinyGPSPlus gps;
#define GPS_SERIAL Serial8

// NeoPixel strip (data on p36, through 74AHCT125D level-shifter)
Adafruit_NeoPixel neo(NEO_NUM_LEDS, PIN_NEO, NEO_GRB + NEO_KHZ800);

// Ethernet UDP
EthernetUDP udp;

// ═══════════════════════════════════════════════════════════════════════════
// SENSOR STATE
// ═══════════════════════════════════════════════════════════════════════════

// Thermocouple readings (°C), updated 2 per loop cycle
static float tc_temp[8] = {0};
static uint8_t tc_read_idx = 0;

// Analog (engineering units)
static float ana1_v = 0;  // 0–5V raw voltage (user scales in dashboard)
static float ana2_v = 0;

// NTC temperatures (°C)
static float ntc_temp[4] = {0};

// RPM (interrupt-driven)
static volatile uint32_t rpm_pulse_count = 0;
static uint32_t rpm_last_calc_ms = 0;
static float rpm_value = 0;

// Digital inputs
static bool dig1 = false, dig2 = false, dig3 = false;

// Accelerometer
static float accel_x = 0, accel_y = 0, accel_z = 0;

// GPS
static float gps_speed_kmh = 0;
static float gps_lat = 0, gps_lng = 0;

// MOSFET output states
static bool mos_state[4] = {false, false, false, false};

// Status
static uint32_t led_last_toggle = 0;
static bool led_state = false;
static uint32_t last_loop_us = 0;
static uint32_t udp_packets_sent = 0;

// ═══════════════════════════════════════════════════════════════════════════
// RPM INTERRUPT
// ═══════════════════════════════════════════════════════════════════════════

void rpm_isr() {
    rpm_pulse_count++;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

float ntc_to_celsius(uint16_t adc_val) {
    if (adc_val == 0 || adc_val >= 1023) return -99.0f;
    float r_ntc = NTC_R0 * (float)adc_val / (1023.0f - (float)adc_val);
    float t_kelvin = 1.0f / (1.0f/NTC_T0 + (1.0f/NTC_B) * logf(r_ntc / NTC_R0));
    return t_kelvin - 273.15f;
}

void update_shift_light(float rpm) {
    // Simple shift light: green < 5000, yellow 5000-6000, red > 6000
    uint32_t color;
    if (rpm < 4000)      color = neo.Color(0, 0, 0);        // off
    else if (rpm < 5000) color = neo.Color(0, 30, 0);       // dim green
    else if (rpm < 5500) color = neo.Color(30, 30, 0);      // yellow
    else if (rpm < 6000) color = neo.Color(60, 15, 0);      // orange
    else                 color = neo.Color(80, 0, 0);        // red SHIFT!

    uint16_t lit = 0;
    if (rpm >= 4000) lit = constrain((uint16_t)((rpm - 4000) / 2000.0f * NEO_NUM_LEDS), 1, NEO_NUM_LEDS);

    for (uint16_t i = 0; i < NEO_NUM_LEDS; i++) {
        neo.setPixelColor(i, i < lit ? color : 0);
    }
    neo.show();
}

// ═══════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════

void setup() {
    Serial.begin(115200);
    Serial.println("Racing Sensor Board v0.5 starting...");

    // ── Status LED ──
    pinMode(PIN_LED, OUTPUT);
    digitalWrite(PIN_LED, HIGH);

    // ── Digital inputs ──
    pinMode(PIN_RPM,  INPUT);
    pinMode(PIN_DIG1, INPUT_PULLUP);
    pinMode(PIN_DIG2, INPUT_PULLUP);
    pinMode(PIN_DIG3, INPUT_PULLUP);

    // RPM interrupt (falling edge = coil fires)
    attachInterrupt(digitalPinToInterrupt(PIN_RPM), rpm_isr, FALLING);

    // ── MOSFET outputs (all off at boot) ──
    pinMode(PIN_MOS1, OUTPUT); digitalWrite(PIN_MOS1, LOW);
    pinMode(PIN_MOS2, OUTPUT); digitalWrite(PIN_MOS2, LOW);
    pinMode(PIN_MOS3, OUTPUT); digitalWrite(PIN_MOS3, LOW);
    pinMode(PIN_MOS4, OUTPUT); digitalWrite(PIN_MOS4, LOW);

    // ── Analog (Teensy ADC defaults: 10-bit, 3.3V ref) ──
    analogReadResolution(10);

    // ── SPI0: MAX31855 thermocouples ──
    SPI.begin();
    for (int i = 0; i < 8; i++) {
        tc[i].begin();
    }
    Serial.println("  MAX31855 x8 initialized on SPI0");

    // ── I2C: LIS3DH accelerometer ──
    Wire.begin();
    Wire.setClock(400000);  // 400 kHz fast mode
    if (lis.begin(0x18)) {
        lis.setRange(LIS3DH_RANGE_4_G);
        lis.setDataRate(LIS3DH_DATARATE_50_HZ);
        Serial.println("  LIS3DH initialized on I2C (0x18)");
    } else {
        Serial.println("  WARNING: LIS3DH not found!");
    }

    // ── GPS (Serial8: RX=p34, TX=p35) ──
    GPS_SERIAL.begin(9600);
    Serial.println("  GPS Serial8 at 9600 baud");

    // ── NeoPixel ──
    neo.begin();
    neo.setBrightness(50);
    neo.clear();
    neo.show();
    Serial.println("  NeoPixel initialized");

    // ── Ethernet (WIZ850io) ──
    // NOTE: If WIZ850io is on SPI1, you need a library fork that supports SPI1.
    //       If sharing SPI0 with MAX31855, standard Ethernet.init(CS_ETH) works.
    pinMode(RST_ETH, OUTPUT);
    digitalWrite(RST_ETH, LOW);
    delay(1);
    digitalWrite(RST_ETH, HIGH);
    delay(200);

    Ethernet.init(CS_ETH);
    Ethernet.begin(mac, teensy_ip);

    if (Ethernet.hardwareStatus() == EthernetNoHardware) {
        Serial.println("  ERROR: W5500 not found! Check SPI wiring.");
    } else {
        Serial.print("  Ethernet OK, IP: ");
        Serial.println(Ethernet.localIP());
    }

    udp.begin(UDP_PORT);

    // ── Ready ──
    Serial.println("Setup complete. Entering main loop at 50 Hz.");
    Serial.print("  Sending UDP to ");
    Serial.print(rpi_ip);
    Serial.print(":");
    Serial.println(UDP_PORT);

    last_loop_us = micros();
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LOOP — 50 Hz
// ═══════════════════════════════════════════════════════════════════════════

void loop() {
    uint32_t now_us = micros();
    if (now_us - last_loop_us < LOOP_INTERVAL_US) return;
    last_loop_us = now_us;

    uint32_t now_ms = millis();

    // ── 1. Read thermocouples (2 per cycle, round-robin) ──
    // Full sweep every 4 cycles = 80ms = 12.5 Hz per channel (fine for temp)
    for (int i = 0; i < 2; i++) {
        float t = tc[tc_read_idx].readCelsius();
        if (!isnan(t)) tc_temp[tc_read_idx] = t;
        tc_read_idx = (tc_read_idx + 1) % 8;
    }

    // ── 2. Read analog inputs (0–5V sensors) ──
    ana1_v = analogRead(PIN_ANA1) * ANA_SCALE;
    ana2_v = analogRead(PIN_ANA2) * ANA_SCALE;

    // ── 3. Read NTC thermistors ──
    ntc_temp[0] = ntc_to_celsius(analogRead(PIN_NTC1));
    ntc_temp[1] = ntc_to_celsius(analogRead(PIN_NTC2));
    ntc_temp[2] = ntc_to_celsius(analogRead(PIN_NTC3));
    ntc_temp[3] = ntc_to_celsius(analogRead(PIN_NTC4));

    // ── 4. Calculate RPM (every 200ms = 5 Hz update) ──
    if (now_ms - rpm_last_calc_ms >= 200) {
        noInterrupts();
        uint32_t pulses = rpm_pulse_count;
        rpm_pulse_count = 0;
        interrupts();

        float elapsed_s = (now_ms - rpm_last_calc_ms) / 1000.0f;
        rpm_value = (pulses / elapsed_s) * 60.0f / RPM_PULSES_PER_REV;
        rpm_last_calc_ms = now_ms;
    }

    // ── 5. Read digital inputs (active low with pull-up) ──
    dig1 = !digitalRead(PIN_DIG1);  // brake
    dig2 = !digitalRead(PIN_DIG2);  // line lock
    dig3 = !digitalRead(PIN_DIG3);  // launch

    // ── 6. Read accelerometer ──
    lis.read();
    sensors_event_t event;
    lis.getEvent(&event);
    accel_x = event.acceleration.x / 9.81f;  // m/s² → G
    accel_y = event.acceleration.y / 9.81f;
    accel_z = event.acceleration.z / 9.81f;

    // ── 7. Read GPS ──
    while (GPS_SERIAL.available()) {
        gps.encode(GPS_SERIAL.read());
    }
    if (gps.speed.isValid()) {
        gps_speed_kmh = gps.speed.kmph();
    }
    if (gps.location.isValid()) {
        gps_lat = gps.location.lat();
        gps_lng = gps.location.lng();
    }

    // ── 8. Auto-control MOSFET outputs ──
    // Fan relay (OUT1): auto based on NTC1 (oil temp)
    if (ntc_temp[0] > FAN_ON_TEMP)  mos_state[0] = true;
    if (ntc_temp[0] < FAN_OFF_TEMP) mos_state[0] = false;

    // Fuel pump (OUT2): on when engine running (RPM > 300)
    mos_state[1] = (rpm_value > 300);

    // Shift light (OUT3): on above threshold RPM
    mos_state[2] = (rpm_value > 5500);

    // Spare (OUT4): manual control only (from dashboard, future)
    // mos_state[3] = false;

    digitalWrite(PIN_MOS1, mos_state[0] ? HIGH : LOW);
    digitalWrite(PIN_MOS2, mos_state[1] ? HIGH : LOW);
    digitalWrite(PIN_MOS3, mos_state[2] ? HIGH : LOW);
    digitalWrite(PIN_MOS4, mos_state[3] ? HIGH : LOW);

    // ── 9. Update NeoPixel shift light ──
    update_shift_light(rpm_value);

    // ── 10. Build and send JSON via UDP ──
    // The backend (udp_receiver.py) expects a flat JSON object on port 5005.
    // All values are engineering units — no raw ADC values.
    // Sensor IDs must match frontend/src/types/index.ts DEFAULT_SENSORS.
    {
        char buf[512];
        int n = snprintf(buf, sizeof(buf),
            "{"
            "\"rpm\":%.0f,"
            "\"speed\":%.1f,"
            "\"oil_temp\":%.1f,"
            "\"oil_press\":%.2f,"
            "\"cht1\":%.0f,"
            "\"cht2\":%.0f,"
            "\"cht3\":%.0f,"
            "\"cht4\":%.0f,"
            "\"egt1\":%.0f,"
            "\"egt2\":%.0f,"
            "\"egt3\":%.0f,"
            "\"egt4\":%.0f,"
            "\"iat\":%.1f,"
            "\"ntc2\":%.1f,"
            "\"ntc3\":%.1f,"
            "\"ntc4\":%.1f,"
            "\"ana1\":%.3f,"
            "\"ana2\":%.3f,"
            "\"battery\":%.2f,"
            "\"accel_x\":%.2f,"
            "\"accel_y\":%.2f,"
            "\"accel_z\":%.2f,"
            "\"gps_lat\":%.6f,"
            "\"gps_lng\":%.6f,"
            "\"dig1\":%d,"
            "\"dig2\":%d,"
            "\"dig3\":%d,"
            "\"mos1\":%d,"
            "\"mos2\":%d,"
            "\"mos3\":%d,"
            "\"mos4\":%d"
            "}",
            rpm_value,
            gps_speed_kmh,
            ntc_temp[0],         // NTC1 → oil_temp (user can reassign in dashboard)
            ana1_v,              // ANA1 → oil_press (raw 0–5V, user scales in dashboard)
            tc_temp[0], tc_temp[1], tc_temp[2], tc_temp[3],  // TC1–4 → CHT
            tc_temp[4], tc_temp[5], tc_temp[6], tc_temp[7],  // TC5–8 → EGT
            ntc_temp[1],         // NTC2 → iat (user can reassign)
            ntc_temp[2],         // NTC3
            ntc_temp[3],         // NTC4
            ana1_v, ana2_v,      // raw 0–5V analog readings
            0.0f,                // battery voltage — TODO: add voltage divider on 12V rail
            accel_x, accel_y, accel_z,
            gps_lat, gps_lng,
            (int)dig1, (int)dig2, (int)dig3,
            (int)mos_state[0], (int)mos_state[1], (int)mos_state[2], (int)mos_state[3]
        );

        if (n > 0 && n < (int)sizeof(buf)) {
            udp.beginPacket(rpi_ip, UDP_PORT);
            udp.write((const uint8_t*)buf, n);
            udp.endPacket();
            udp_packets_sent++;
        }
    }

    // ── 11. Heartbeat LED (1 Hz blink) ──
    if (now_ms - led_last_toggle >= LED_BLINK_MS) {
        led_state = !led_state;
        digitalWrite(PIN_LED, led_state ? HIGH : LOW);
        led_last_toggle = now_ms;
    }

    // ── 12. Debug output (every 2 seconds) ──
    static uint32_t last_debug = 0;
    if (now_ms - last_debug >= 2000) {
        Serial.printf("[%lus] RPM:%.0f SPD:%.1f CHT:%.0f/%.0f/%.0f/%.0f OIL:%.1fC "
                      "ANA1:%.2fV GPS:%s UDP:%lu\n",
                      now_ms / 1000,
                      rpm_value, gps_speed_kmh,
                      tc_temp[0], tc_temp[1], tc_temp[2], tc_temp[3],
                      ntc_temp[0], ana1_v,
                      gps.location.isValid() ? "fix" : "no_fix",
                      udp_packets_sent);
        last_debug = now_ms;
    }
}
