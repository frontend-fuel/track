#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>

// Pin definitions
const int BUZZER_PIN = 5;  // GPIO5 for buzzer
const int GPS_RX_PIN = 16;  // GPIO16 for GPS RX
const int GPS_TX_PIN = 17;  // GPIO17 for GPS TX

// GPS objects
TinyGPSPlus gps;
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);

// ThingSpeak settings
const char* THINGSPEAK_READ_API = "GN2J04LOQ42F0VDD";  // Your ThingSpeak Read API Key
const char* THINGSPEAK_CHANNEL = "2363067";  // Your ThingSpeak Channel ID
const unsigned long CHECK_INTERVAL = 15000;  // Check ThingSpeak every 15 seconds

// Variables to store WiFi credentials
String ssid = "";
String password = "";
String lastSSID = "";

// Variables for buzzer control
bool buzzerState = false;
unsigned long buzzerStartTime = 0;
const unsigned long BUZZER_TIMEOUT = 30000;  // 30 seconds timeout

void setup() {
    Serial.begin(115200);
    gpsSerial.begin(9600);  // Initialize GPS serial communication
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);  // Ensure buzzer is off initially
    
    // Initial check for WiFi credentials
    checkThingSpeakForCredentials();
}

void loop() {
    static unsigned long lastCheck = 0;
    unsigned long currentMillis = millis();
    
    // Process GPS data
    while (gpsSerial.available() > 0) {
        if (gps.encode(gpsSerial.read())) {
            // Update GPS location when new valid data is available
            if (gps.location.isValid()) {
                updateGPSLocation();
            }
        }
    }
    
    // Check ThingSpeak periodically
    if (currentMillis - lastCheck >= CHECK_INTERVAL) {
        lastCheck = currentMillis;
        checkThingSpeakForCredentials();
        checkBuzzerControl();
    }
    
    // Handle buzzer timeout
    if (buzzerState && (currentMillis - buzzerStartTime >= BUZZER_TIMEOUT)) {
        buzzerState = false;
        digitalWrite(BUZZER_PIN, LOW);
        Serial.println("Buzzer automatically turned off after timeout");
    }
}

// Function to update GPS location to ThingSpeak
void updateGPSLocation() {
    if (WiFi.status() == WL_CONNECTED && gps.location.isValid()) {
        HTTPClient http;
        String url = "https://api.thingspeak.com/update?api_key=";
        url += THINGSPEAK_READ_API;
        url += "&field1=";
        url += String(gps.location.lat(), 6);  // Latitude
        url += "&field2=";
        url += String(gps.location.lng(), 6);  // Longitude
        
        http.begin(url);
        int httpCode = http.GET();
        
        if (httpCode == HTTP_CODE_OK) {
            Serial.println("GPS location updated to ThingSpeak");
            Serial.print("Latitude: ");
            Serial.println(gps.location.lat(), 6);
            Serial.print("Longitude: ");
            Serial.println(gps.location.lng(), 6);
        }
        http.end();
    }
}

void checkThingSpeakForCredentials() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        String url = "https://api.thingspeak.com/channels/";
        url += THINGSPEAK_CHANNEL;
        url += "/feeds.json?api_key=";
        url += THINGSPEAK_READ_API;
        url += "&results=1";
        
        http.begin(url);
        int httpCode = http.GET();
        
        if (httpCode == HTTP_CODE_OK) {
            String payload = http.getString();
            DynamicJsonDocument doc(1024);
            deserializeJson(doc, payload);
            
            if (doc.containsKey("feeds") && doc["feeds"].size() > 0) {
                JsonObject feed = doc["feeds"][0];
                String newSSID = feed["field4"].as<String>();
                String newPassword = feed["field5"].as<String>();
                
                // Check if WiFi credentials have changed
                if (newSSID != "" && newPassword != "" && 
                    (newSSID != ssid || newPassword != password)) {
                    ssid = newSSID;
                    password = newPassword;
                    connectToWiFi();
                }
                
                // Check buzzer state
                int buzzerValue = feed["field3"].as<int>();
                if (buzzerValue == 1 && !buzzerState) {
                    buzzerState = true;
                    buzzerStartTime = millis();
                    digitalWrite(BUZZER_PIN, HIGH);
                    Serial.println("Buzzer turned ON");
                } else if (buzzerValue == 0 && buzzerState) {
                    buzzerState = false;
                    digitalWrite(BUZZER_PIN, LOW);
                    Serial.println("Buzzer turned OFF");
                }
            }
        }
        http.end();
    } else {
        // If not connected to WiFi, try to connect
        if (ssid != "" && password != "") {
            connectToWiFi();
        }
    }
}

void connectToWiFi() {
    Serial.println("Connecting to WiFi...");
    Serial.print("SSID: ");
    Serial.println(ssid);
    
    WiFi.begin(ssid.c_str(), password.c_str());
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected!");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nFailed to connect to WiFi");
    }
}

void checkBuzzerControl() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        String url = "https://api.thingspeak.com/channels/";
        url += THINGSPEAK_CHANNEL;
        url += "/fields/3/last.json?api_key=";
        url += THINGSPEAK_READ_API;
        
        http.begin(url);
        int httpCode = http.GET();
        
        if (httpCode == HTTP_CODE_OK) {
            String payload = http.getString();
            DynamicJsonDocument doc(256);
            deserializeJson(doc, payload);
            
            int buzzerValue = doc["field3"].as<int>();
            if (buzzerValue == 1 && !buzzerState) {
                buzzerState = true;
                buzzerStartTime = millis();
                digitalWrite(BUZZER_PIN, HIGH);
                Serial.println("Buzzer turned ON");
            } else if (buzzerValue == 0 && buzzerState) {
                buzzerState = false;
                digitalWrite(BUZZER_PIN, LOW);
                Serial.println("Buzzer turned OFF");
            }
        }
        http.end();
    }
}