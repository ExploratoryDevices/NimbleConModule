# Nimble Controller Module - Hardware Specifications

![Controller module board image](./nimble-controller-module-board.jpg)

## April 20, 2022

Hardware specs:
- 1x [ESP32-based controller](https://www.espressif.com/en/products/socs/esp32) 
    - Dual core Xtensa 32-bit LX6 microprocessors
    - Onboard WiFi, Bluetooth, USB
    - Arduino compatible
- 1x Actuator communications port (Label "A")
    - [6P2C RJ11](https://en.wikipedia.org/wiki/Registered_jack#RJ11,_RJ14,_RJ25_wiring) female plug (telephone line connection to actuator)
    - Pin 1: Unused
    - Pin 2: +12v
    - Pin 3: TX (at 5v)
    - Pin 4: RX (at 5v)
    - Pin 5: GND
    - Pin 6: Unused
- 1x Control pendant communications port (Label "P")
    - [6P2C RJ11](https://en.wikipedia.org/wiki/Registered_jack#RJ11,_RJ14,_RJ25_wiring) female plug (telephone line connection to pendant)
    - Same pinout as actuator port
- 1x Analog sensor input 1/8" TRS. 0-5V signal with power supply (Label "S")
    - Tip = 5V 
    - Ring = Sensor input (0-5V range) 
    - Shaft = Ground
- 1x Micro-USB 2.0 port 12 Mbps
    - Displays as "[Silicon Laboratories CP2102 USB to UART Bridge Controller](https://www.silabs.com/interface/usb-bridges/classic/device.cp2102?tab=techdocs)"
- 1x [24PPR clickable encoder](https://howtomechatronics.com/tutorials/arduino/rotary-encoder-works-use-arduino/) (Dial)
- 8x LEDs around the encoder ring (green)
- 4x Other LEDs:
    - Actuator connectivity LED (green)
    - Pendant connectivity LED (green)
    - Bluetooth status LED (blue)
    - Wifi status LED (white)
