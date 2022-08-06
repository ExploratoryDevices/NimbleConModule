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

// ADC Pins
#define ADC_REF 32
#define SENSOR_ADC 33

// Encoder LEDs
#define ENC_LED_1 4
#define ENC_LED_2 5
#define ENC_LED_3 12
#define ENC_LED_4 13
#define ENC_LED_5 21
#define ENC_LED_6 22
#define ENC_LED_7 23
#define ENC_LED_8 25

// Other LEDs
#define ACT_LED 18
#define PEND_LED 19
#define BT_LED 26
#define WIFI_LED 27

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

  // LED Pin Modes
  pinMode(ENC_LED_1, OUTPUT);
  pinMode(ENC_LED_2, OUTPUT);
  pinMode(ENC_LED_3, OUTPUT);
  pinMode(ENC_LED_4, OUTPUT);
  pinMode(ENC_LED_5, OUTPUT);
  pinMode(ENC_LED_6, OUTPUT);
  pinMode(ENC_LED_7, OUTPUT);
  pinMode(ENC_LED_8, OUTPUT);
  pinMode(ACT_LED, OUTPUT);
  pinMode(PEND_LED, OUTPUT);
  pinMode(BT_LED, OUTPUT);
  pinMode(WIFI_LED, OUTPUT);

  // Attach PWM to LED pins (pin, PWM channel)
  ledcAttachPin(ENC_LED_1, 0);
  ledcAttachPin(ENC_LED_2, 1);
  ledcAttachPin(ENC_LED_3, 2);
  ledcAttachPin(ENC_LED_4, 3);
  ledcAttachPin(ENC_LED_5, 4);
  ledcAttachPin(ENC_LED_6, 5);
  ledcAttachPin(ENC_LED_7, 6);
  ledcAttachPin(ENC_LED_8, 7);
  ledcAttachPin(ACT_LED, 8);
  ledcAttachPin(PEND_LED, 9);
  ledcAttachPin(BT_LED, 10);
  ledcAttachPin(WIFI_LED, 11);

  // Configure PWM channels (PWM channel, PWM frequency, PWM counter bits)
  ledcSetup(0,  1000, 8);
  ledcSetup(1,  1000, 8);
  ledcSetup(2,  1000, 8);
  ledcSetup(3,  1000, 8);
  ledcSetup(4,  1000, 8);
  ledcSetup(5,  1000, 8);
  ledcSetup(6,  1000, 8);
  ledcSetup(7,  1000, 8);
  ledcSetup(8,  1000, 8);
  ledcSetup(9,  1000, 8);
  ledcSetup(10,  1000, 8);
  ledcSetup(11,  1000, 8);
}

void driveLEDs(byte LEDScale)
{
  byte dimmer = 75; // No visible difference between values between 75 and 255.
  
  ledcWrite(0, dimmer);
  LEDScale > 35 ? ledcWrite(1, min(100, map(LEDScale,35,69,0,dimmer))) : ledcWrite(1, 0);
  LEDScale > 69 ? ledcWrite(2, min(100, map(LEDScale,69,104,0,dimmer))) : ledcWrite(2, 0);
  LEDScale > 104 ? ledcWrite(3, min(100, map(LEDScale,104,139,0,dimmer))) : ledcWrite(3, 0);
  LEDScale > 139 ? ledcWrite(4, min(100, map(LEDScale,139,173,0,dimmer))) : ledcWrite(4, 0);
  LEDScale > 173 ? ledcWrite(5, min(100, map(LEDScale,173,208,0,dimmer))) : ledcWrite(5, 0);
  LEDScale > 208 ? ledcWrite(6, min(100, map(LEDScale,208,242,0,dimmer))) : ledcWrite(6, 0);
  LEDScale > 242 ? ledcWrite(7, min(100, map(LEDScale,242,255,0,dimmer))) : ledcWrite(7, 0);
}

void sendToAct()
{
  // Parse settings for transmission ------------------------------------------------------------
   
  byte outgoingPacket[7], statusByte = 0;
  bool positionNegative = 0;
  int checkWord;
  
  //Serial.println(positionCommand);
  
  if(positionCommand < 0)
  {
    positionCommand *= -1;
    positionNegative = 1;
  }else positionNegative = 0;

  statusByte |= activated;
  statusByte |= airOut << 1;
  statusByte |= airIn << 2;
  statusByte |= setExtent << 4;
  statusByte |= 0x80;  // SYSTEM_TYPE: NimbleStroker

  outgoingPacket[0] = statusByte;
  outgoingPacket[1] = positionCommand & 0xFF;
  outgoingPacket[2] = positionCommand >> 8;
  outgoingPacket[2] |= positionNegative << 2;
  outgoingPacket[3] = forceCommand & 0xFF;
  outgoingPacket[4] = forceCommand >> 8;

  checkWord = 0;
  for(byte i = 0; i <= 4; i++)
  {
    checkWord += outgoingPacket[i];
  }

  outgoingPacket[5] = checkWord & 0x00FF;
  outgoingPacket[6] = checkWord >> 8;
  
  for(byte i = 0; i <= 6; i++)
  {
    Serial.write(outgoingPacket[i]);
  }
}

void readFromPend()
{
  static byte byteCounter = 0, errorCounter = 0, statusByte = 0;
  static long lastTime = 0, lastPacket = 0;
  static byte incomingPacket[7];
  int checkWord, checkSum;

  lastPacket = millis()-lastTime;
  
  if(lastPacket > PACKET_TIMEOUT)                 // If the last packet was more than the timeout ago, set everything to zero.
  {
    positionCommand = 0;
    forceCommand = IDLE_FORCE;
    digitalWrite(LED1, LOW);
  }
  
  while(Serial.available())     // Clear serial buffer and fill the incomingPacket array with the first 10 bytes.
  {
    
    for(byte i = 1; i <= 6 ; i++) // Shift all bytes in the array to make room for the new one.
    {
      incomingPacket[i-1] = incomingPacket[i];
    }
    
    incomingPacket[6] = Serial.read();  // put the new byte in the array.
  
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
        positionCommand = (incomingPacket[2] << 8) | incomingPacket[1];
        if(positionCommand & 0x0400)  // if negative bit is set
        {
          positionCommand &= ~(0x0400); // clear negative bit
          positionCommand *= -1;        // Set as negative
        }
        forceCommand = (incomingPacket[4] << 8) | incomingPacket[3];
  
        //Serial.println("Checksum: ");
        //Serial.println(checkSum, HEX);
        //Serial.println(statusByte, HEX);
    
        activated = (statusByte & 0x01) ? 1 : 0;
        airOut = (statusByte & 0x02) ? 1 : 0;
        airIn = (statusByte & 0x04) ? 1 : 0;
        setExtent = (statusByte & 0x10) ? 1 : 0;
  
        digitalWrite(LED1, HIGH);
      }
    }
  }
}
