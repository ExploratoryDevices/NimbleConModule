// Use "ESP32 Dev Module" as board

#include "nimbleCon.h"

void setup() {
  // put your setup code here, to run once:
  initNimbleSDK();

  /*ledcWrite(8, 50);
  ledcWrite(9, 50);
  ledcWrite(10, 50);
  ledcWrite(11, 50);*/

}

void loop() {
  // put your main code here, to run repeatedly:
  
  if(pendSerial.available()) ledcWrite(9, 50);
  if(actSerial.available()) ledcWrite(8, 50);
  if(digitalRead(ENC_BUTT))
  {
    driveLEDs(encoder.getCount());
    if(pendSerial.available()) actSerial.write(pendSerial.read());
  }else
  {
    driveLEDs(0);
  }

  // print ADC values to USB
  //Serial.print(analogRead(ADC_REF));
  //Serial.print(", ");
  //Serial.println(analogRead(SENSOR_ADC));
}
