# NimbleConModule
Nimble Connectivity Module (Basic functions and library).
This code is designed to run on the Nimble Connectivity Module.

## IDE Setup

The connectivity module can be uploaded to using the Ardiuno IDE set to `ESP32 Dev Module`.

If the "ESP32 Dev Module" is not available in your IDE, check out [this tutorial](https://randomnerdtutorials.com/installing-the-esp32-board-in-arduino-ide-windows-instructions/) for information on adding the needed plug-ins to your Arduino IDE.

If, after connecting your device, no new ports are avialable in the Arduino IDE, you may need to install drivers for the USB-to-Serial capabilities of the ESP32 used in the Connectivity Module. The CP201x drivers are available [on the silicon labs website](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers?tab=downloads).

The NimbleConModule project also requires the `ESP32Encoder` library. This can be downloaded using the Library Manager in the Arduino IDE. This can be accessed by going through the menu at Sketch > Include Libraries > Manage Libraries, or by hitting _Control+Shift+i_.

See also: [NimbleConModule Setup Guide for Arduino IDE v1 on Windows PC](./docs/setup-guide-windows-arduino-ide1.md)

## How to use:

Pendant and Actuator parameters are stored as structs with the following format:
```
struct Actuator
{
  bool present;

  // Signals from the actuator
  long positionFeedback;  // (range: -1000 to 1000) Errata: actuator delivered before January 2023 this signal always reads positive.
  long forceFeedback; // (range: -1023 to 1023)
  bool tempLimiting;  // Reads high if the actuator is thermally limiting its performance.
  bool sensorFault;   // Reads high if there's a fault in the position sensor.

  // Signals to the actuator
  long positionCommand; // (range: -1000 to 1000)
  long forceCommand;  // (range: 0 to 1023)
  bool activated; // Not used
  bool airOut;  // Set high to open air-out valve
  bool airIn;   // Set high to open air-in valve
};
```
```
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
```
Update the values in the structs with the desired values (either generated in the connectivity module or from some external source).

Data is sent to the actautor on a free-running basis. To disable, set forceCommand to 0.
Data from the actuator is updated in the actuator struct as new data is received. The readFromAct() function will return "1" if the data was updated, in case this is important to you.
Data from the pendant (if plugged in) is updated in the pendant struct as new data is received. The readFromAct() function will return "1" if the data was updated, in case this is important to you.

See also: [Nimble Controller Module - Hardware Specifications](./docs/hardware-specs.md)
