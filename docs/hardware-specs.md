# Nimble Controller Module - Hardware Specifications

![Controller module board image](./nimble-controller-module-board.jpg)

## April 20, 2022

Hardware specs:
- 1x [ESP32-based controller](https://www.espressif.com/en/products/socs/esp32) (WiFi, Bluetooth, USB) Arduino compatible
- 1x actuator communications port (Label "A")
- 1x control pendant communications port (Label "P")
- 1x analog sensor input 1/8" TRS. 0-5V signal with power supply (Label "S")
- 1x 24PPR clickable encoder with LED ring for display (Dial)
- 1x micro-USB 2.0 port 12 Mbps
    - Displays as "[Silicon Laboratories CP2102 USB to UART Bridge Controller](https://www.silabs.com/interface/usb-bridges/classic/device.cp2102?tab=techdocs)"
- 8x Adressable Encoder dial LEDs (green)
- 4x other LEDs:
    - Actuator connectivity LED (green)
    - Pendant Connectivity LED (green)
    - Bluetooth Status LED (blue)
    - Wifi Status LED (white)
