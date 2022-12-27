#include <ESP32Encoder.h> // https://github.com/madhephaestus/ESP32Encoder
#include <HardwareSerial.h> // Arduino Core ESP32 Hardware serial library

// min() function needs this to work on ESP32
#ifndef min
#define min(a,b) (((a) < (b)) ? (a) : (b))
#endif

// Encoder pins
#define ENC_BUTT 2
#define ENC_A 35
#define ENC_B 34

ESP32Encoder encoder;

// Serial pins
#define PEND_RX 14
#define PEND_TX 15
#define ACT_RX 16
#define ACT_TX 17

HardwareSerial pendSerial(1);
HardwareSerial actSerial(2);

#define PACKET_TIMEOUT 50  // Time duration (ms) for packet timeout

// ADC Pins
#define ADC_REF 32
#define SENSOR_ADC 33

// Encoder LED PWM channels
#define ENC_LED_1 0
#define ENC_LED_2 1
#define ENC_LED_3 2
#define ENC_LED_4 3
#define ENC_LED_5 4
#define ENC_LED_6 5
#define ENC_LED_7 6
#define ENC_LED_8 7

// Other LED PWM channels
#define ACT_LED 8
#define PEND_LED 9
#define BT_LED 10
#define WIFI_LED 11

// Timers for sending serial data to actuator and pendant
#define SEND_INTERVAL 2000 // microseconds between packets sent.

int timeSinceLastActSend = 0;
int timeSinceLastPendSend = 0;

volatile int timerTriggered;

hw_timer_t * timer = NULL;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

void IRAM_ATTR onTimer() {
  portENTER_CRITICAL_ISR(&timerMux);
  timerTriggered = 1; // Set timer as triggered.
  portEXIT_CRITICAL_ISR(&timerMux);
}

bool checkTimer()
{
  if(timerTriggered == 1)
  {
    portENTER_CRITICAL(&timerMux);
    timerTriggered = 0; // Clear timer flag
    portEXIT_CRITICAL(&timerMux);
    return(1);  // Return 1 to indicate timer has triggered
  }
  return(0);
}

// Pendant Variables
#define IDLE_FORCE 200  // Default centering force to send when no value position signal is received.

struct Pendant
{
  bool present;
  // Signals from the pendant
  long positionCommand;
  long forceCommand;
  bool activated;
  bool airOut;
  bool airIn;

  // Signals to the pendant
  long positionFeedback;
  long forceFeedback;
  bool tempLimiting;
  bool sensorFault;
};

struct Pendant pendant; // Declare pendant

// Actuator Variables
struct Actuator
{
  bool present;

  // Signals from the actuator
  long positionFeedback;
  long forceFeedback;
  bool tempLimiting;
  bool sensorFault;

  // Signals to the actuator
  long positionCommand;
  long forceCommand;
  bool activated;
  bool airOut;
  bool airIn;
};

struct Actuator actuator; // Declare actuator

//Initialization fuction
void initNimbleSDK()
{
  // Setup encoder
  pinMode(ENC_BUTT, INPUT_PULLUP);
  pinMode(ENC_A, INPUT_PULLUP);
  pinMode(ENC_B, INPUT_PULLUP);

  ESP32Encoder::useInternalWeakPullResistors=UP;
  encoder.attachHalfQuad(ENC_A, ENC_B);
  encoder.setCount(37);

  // Setup serial ports
  Serial.begin(115200); // open serial port for USB connection
  pendSerial.begin(115200, SERIAL_8N1, PEND_RX, PEND_TX); // open serial port for pendant
  actSerial.begin(115200, SERIAL_8N1, ACT_RX, ACT_TX);  // open serial port for actuator

  // Set up timer interrupt.
  timer = timerBegin(0, 80, true);  // Set timer parameters
  timerAttachInterrupt(timer, &onTimer, true);  // Attach interrupt to ISR
  timerAlarmWrite(timer, SEND_INTERVAL, true);  // Configure timer threshold
  timerAlarmEnable(timer); // Enable timer

  digitalWrite(ENC_LED_1, LOW);

  // Attach PWM to LED pins (pin, PWM channel)
  ledcAttachPin(4, ENC_LED_1);
  ledcAttachPin(5, ENC_LED_2);
  ledcAttachPin(12, ENC_LED_3);
  ledcAttachPin(13, ENC_LED_4);
  ledcAttachPin(21, ENC_LED_5);
  ledcAttachPin(22, ENC_LED_6);
  ledcAttachPin(23, ENC_LED_7);
  ledcAttachPin(25, ENC_LED_8);
  ledcAttachPin(18, ACT_LED);
  ledcAttachPin(19, PEND_LED);
  ledcAttachPin(26, BT_LED);
  ledcAttachPin(27, WIFI_LED);

  // Configure PWM channels (PWM channel, PWM frequency, PWM counter bits)
  ledcSetup(ENC_LED_1,  1000, 8);
  ledcSetup(ENC_LED_2,  1000, 8);
  ledcSetup(ENC_LED_3,  1000, 8);
  ledcSetup(ENC_LED_4,  1000, 8);
  ledcSetup(ENC_LED_5,  1000, 8);
  ledcSetup(ENC_LED_6,  1000, 8);
  ledcSetup(ENC_LED_7,  1000, 8);
  ledcSetup(ENC_LED_8,  1000, 8);
  ledcSetup(ACT_LED,  1000, 8);
  ledcSetup(PEND_LED,  1000, 8);
  ledcSetup(BT_LED,  1000, 8);
  ledcSetup(WIFI_LED,  1000, 8);
}

void driveLEDs(byte LEDScale)
{
  byte dimmer = 75; // No visible difference between values between 75 and 255.
  
  ledcWrite(ENC_LED_1, dimmer);
  LEDScale > 35 ? ledcWrite(ENC_LED_2, min(100, map(LEDScale,35,69,0,dimmer))) : ledcWrite(ENC_LED_2, 0);
  LEDScale > 69 ? ledcWrite(ENC_LED_3, min(100, map(LEDScale,69,104,0,dimmer))) : ledcWrite(ENC_LED_3, 0);
  LEDScale > 104 ? ledcWrite(ENC_LED_4, min(100, map(LEDScale,104,139,0,dimmer))) : ledcWrite(ENC_LED_4, 0);
  LEDScale > 139 ? ledcWrite(ENC_LED_5, min(100, map(LEDScale,139,173,0,dimmer))) : ledcWrite(ENC_LED_5, 0);
  LEDScale > 173 ? ledcWrite(ENC_LED_6, min(100, map(LEDScale,173,208,0,dimmer))) : ledcWrite(ENC_LED_6, 0);
  LEDScale > 208 ? ledcWrite(ENC_LED_7, min(100, map(LEDScale,208,242,0,dimmer))) : ledcWrite(ENC_LED_7, 0);
  LEDScale > 242 ? ledcWrite(ENC_LED_8, min(100, map(LEDScale,242,255,0,dimmer))) : ledcWrite(ENC_LED_8, 0);
}

void sendToAct()
{
  // Parse settings for transmission ------------------------------------------------------------
   
  byte outgoingPacket[7], statusByte = 0;
  bool positionNegative = 0;
  int checkWord;
  
  //Serial.println(positionCommand);
  
  if(actuator.positionCommand < 0)
  {
    actuator.positionCommand *= -1;
    positionNegative = 1;
  }else positionNegative = 0;

  statusByte |= actuator.activated;
  statusByte |= actuator.airOut << 1;
  statusByte |= actuator.airIn << 2;
  statusByte |= 0x80;  // SYSTEM_TYPE: NimbleStroker

  outgoingPacket[0] = statusByte;
  outgoingPacket[1] = actuator.positionCommand & 0xFF;
  outgoingPacket[2] = actuator.positionCommand >> 8;
  outgoingPacket[2] |= positionNegative << 2;
  outgoingPacket[3] = actuator.forceCommand & 0xFF;
  outgoingPacket[4] = actuator.forceCommand >> 8;

  checkWord = 0;
  for(byte i = 0; i <= 4; i++)
  {
    checkWord += outgoingPacket[i];
  }

  outgoingPacket[5] = checkWord & 0x00FF;
  outgoingPacket[6] = checkWord >> 8;
  
  for(byte i = 0; i <= 6; i++)
  {
    actSerial.write(outgoingPacket[i]);
  }
}

bool readFromPend()
{
  static byte byteCounter = 0, errorCounter = 0, statusByte = 0;
  static long lastTime = 0, lastPacket = 0;
  static byte incomingPacket[7];
  int checkWord, checkSum;

  lastPacket = millis()-lastTime;
  
  if(lastPacket > PACKET_TIMEOUT)                 // If the last packet was more than the timeout ago, set everything to zero.
  {
    pendant.positionCommand = 0;
    pendant.forceCommand = IDLE_FORCE;
    pendant.present = false;
  }
  
  while(pendSerial.available())     // Clear pendant incoming serial buffer and fill the incomingPacket array with the first 10 bytes.
  {
    
    for(byte i = 1; i <= 6 ; i++) // Shift all bytes in the array to make room for the new one.
    {
      incomingPacket[i-1] = incomingPacket[i];
    }
    
    incomingPacket[6] = pendSerial.read();  // put the new byte in the array.
  
    checkSum = 0;               // Reset the checksum before proceeding
    
    for(byte i = 0; i <= 4; i++) checkSum += incomingPacket[i]; // Sum all elements in the array
  
    checkWord = (incomingPacket[6] << 8) | incomingPacket[5];   // Extract the sent checksum from the array
    
    if(checkWord == checkSum && checkWord != 0)   // If they match (and aren't zero), update all the variables from the values in the array.
    {
      lastTime = millis();        // Reset the time since the last packet was received.

      statusByte = incomingPacket[0];

      incomingPacket[2] &= 0x07;  // Drop the NODE_TYPE designation from this byte.
      incomingPacket[4] &= 0x07;  // Drop any random bits from this byte.

      if((statusByte & 0xE0) == 0x80 && (incomingPacket[4] & 0xF8) == 0)  // Verify that the system type and check bits are as expected. If not, don't process the packet.
      {
        pendant.positionCommand = (incomingPacket[2] << 8) | incomingPacket[1];
        if(pendant.positionCommand & 0x0400)  // if negative bit is set
        {
          pendant.positionCommand &= ~(0x0400); // clear negative bit
          pendant.positionCommand *= -1;        // Set as negative
        }
        pendant.forceCommand = (incomingPacket[4] << 8) | incomingPacket[3];
    
        pendant.activated = (statusByte & 0x01) ? 1 : 0;
        pendant.airOut = (statusByte & 0x02) ? 1 : 0;
        pendant.airIn = (statusByte & 0x04) ? 1 : 0;
        
        pendant.present = true;
        return(1);  // Return 1 since the struct was updated this call.
      }
    }
    return(0); // Return 0 since the struct was not updated this call.
  }
}

bool readFromAct()
{
  static byte byteCounter = 0, errorCounter = 0, statusByte = 0;
  static long lastTime = 0, lastPacket = 0;
  static byte incomingPacket[7];
  int checkWord, checkSum;

  lastPacket = millis()-lastTime;
  
  if(lastPacket > PACKET_TIMEOUT)                 // If the last packet was more than the timeout ago, set everything to zero.
  {
    actuator.present = false;
  }
  
  while(actSerial.available())     // Clear pendant incoming serial buffer and fill the incomingPacket array with the first 10 bytes.
  {
    
    for(byte i = 1; i <= 6 ; i++) // Shift all bytes in the array to make room for the new one.
    {
      incomingPacket[i-1] = incomingPacket[i];
    }
    
    incomingPacket[6] = actSerial.read();  // put the new byte in the array.
  
    checkSum = 0;               // Reset the checksum before proceeding
    
    for(byte i = 0; i <= 4; i++) checkSum += incomingPacket[i]; // Sum all elements in the array
  
    checkWord = (incomingPacket[6] << 8) | incomingPacket[5];   // Extract the sent checksum from the array
    
    if(checkWord == checkSum && checkWord != 0)   // If they match (and aren't zero), update all the variables from the values in the array.
    {
      lastTime = millis();        // Reset the time since the last packet was received.

      statusByte = incomingPacket[0];

      incomingPacket[2] &= 0x07;  // Drop the NODE_TYPE designation from this byte.
      incomingPacket[4] &= 0x07;  // Drop any random bits from this byte.

      if((statusByte & 0xE0) == 0x80 && (incomingPacket[4] & 0xF8) == 0)  // Verify that the system type and check bits are as expected. If not, don't process the packet.
      {
        actuator.positionFeedback = (incomingPacket[2] << 8) | incomingPacket[1];
        if(actuator.positionFeedback & 0x0400)  // if negative bit is set
        {
          actuator.positionFeedback &= ~(0x0400); // clear negative bit
          actuator.positionFeedback *= -1;        // Set as negative
        }
        actuator.forceFeedback = (incomingPacket[4] << 8) | incomingPacket[3];
        if(actuator.forceFeedback & 0x0400)  // if negative bit is set
        {
          actuator.forceFeedback &= ~(0x0400); // clear negative bit
          actuator.forceFeedback *= -1;        // Set as negative
        }
    
        actuator.activated = (statusByte & 0x01) ? 1 : 0;
        actuator.sensorFault = (statusByte & 0x02) ? 1 : 0;
        actuator.tempLimiting = (statusByte & 0x04) ? 1 : 0;
        
        actuator.present = true;
        return(1);  // Return 1 since the struct was updated this call.
      }
    }
    return(0); // Return 0 since the struct was not updated this call.
  }
}
