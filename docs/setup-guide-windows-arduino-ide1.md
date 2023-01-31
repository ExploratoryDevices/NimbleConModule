# NimbleConModule Setup Guide for Arduino IDE v1 on Windows PC

**Note:** These instructions were last tested on Jan 29, 2023.

## Prerequisites

- Windows 10 or 11 PC
- [Git client](https://git-scm.com/downloads/guis) installed
- [Arduino IDE](https://www.arduino.cc/en/software) version 1.x installed (tested with v1.8.19)
  
## Setup Instructions

### Install Windows Virtual COM Port (VCP) drivers

1. Download: [CP210x Universal Windows Driver](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers?tab=downloads) from Silicon Labs (tested with v11.2.0)
2. Extract the driver .zip file to folder
3. Open Windows "Device Manager"
4. Attach the NimbleConModule to the PC via the USB cable.
5. There should be a new device listed under `Other devices`
6. Select the `Silicon Labs CP210x USB to UART Bride` device
7. Right-click "Properties", navigate to "Driver" tab
8. Click "Update Driver" -> "Browse my computer for drivers"
9. Navigate to the driver zip folder that was extracted in step 2
10. Click Next to install.
11. The device should now be listed in Device Manger under "Ports (COM & LPT). Make note of the COM port for future steps (ie. "COM3").

### Set up Arduino IDE Plugins for ESP32 development

1. Launch the Arduino IDE (v1.x)
2. Add ESP32 repositories to the Board Manager:
   - Navigate to menu: `File -> Preferences -> Settings (tab)`
   - Copy paste the following repo into the `Additional Boards Manager URLs:` field:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Note: Use commas to separate the URLs if you have added other repos.
3. Install the ESP32 boards package:
   - Open Boards Manager in menu: `Tools -> Board -> Boards Manager`
   - In search field enter: "esp32"
   - Install item "esp32 by Espressif Systems" (tested with v2.06)
4. Install the ESP32Encoder library:
   - Open the Library Manager in menu: `Tools -> Manage Libraries`
   - In search field enter "ESP32Encoder"
   - Install item "ESP32Encoder" (tested with v0.10.1) 
5. Select the Board:
   - Navigate to and select `Tools -> Board -> ESP32 Arduino -> ESP32 Dev Module`
6. Select the COM port:
   - Navigate to `Tools -> Port` and select the listed COM port (ie. "COM3")
7. Display board info via `Tools -> Get Board Info`, which should show the VID and PID of the board.

### Set up the NimbleConModule project

1. In a Command Prompt or PowerShell terminal, navigate to your Arduino IDE projects folder, (ie. `cd C:\Users\youruser\Documents\Arduino`)
2. Clone this repo into that folder: `git clone https://github.com/ExploratoryDevices/NimbleConModule.git`
3. Launch the Arduino IDE (v1.x)
4. Open the Arduino sketch: `File -> Open` navigate to `NimbleConModule -> NimbleConSDK` select `NimbleConSDK.ino` and click "Open".
5. Click the "Upload" button to compile and transfer the NimbleConSDK project to the module.
6. You should see "Done uploading." with output similar to:
   ```
   Hash of data verified.
   Compressed 8192 bytes to 47...
   Writing at 0x0000e000... (100 %)
   Wrote 8192 bytes (47 compressed) at 0x0000e000 in 0.2 seconds (effective 375.1 kbit/s)...
   Hash of data verified.
   Compressed 280512 bytes to 155923...
   Writing at 0x00010000... (10 %)
   Writing at 0x0001c618... (20 %)
   Writing at 0x00024c96... (30 %)
   Writing at 0x0002a6a7... (40 %)
   Writing at 0x0002fb60... (50 %)
   Writing at 0x00034fef... (60 %)
   Writing at 0x0003d73a... (70 %)
   Writing at 0x00046c4d... (80 %)
   Writing at 0x0004c15d... (90 %)
   Writing at 0x00051862... (100 %)
   Wrote 280512 bytes (155923 compressed) at 0x00010000 in 2.6 seconds (effective 852.8 kbit/s)...
   Hash of data verified.

   Leaving...
   Hard resetting via RTS pin...
   ```
7. Try out the demo on the physical module device. Turn the dial to increase the brightness and number of LEDs. Press the dial down to blank the LED, and release to show the LEDs again.

Start hacking from here. Continue to use the "Upload" button to recompile and push your code to the device. 

For debugging, open the Serial Monitor via `Tools -> Serial Monitor` and set the baud rate to `115200 baud`. Add some `Serial.println(...)` lines to your code to see output in the Serial Monitor.

## Additional References

- <https://randomnerdtutorials.com/installing-the-esp32-board-in-arduino-ide-windows-instructions/>
- <https://dronebotworkshop.com/esp32-intro/>
- <https://www.arduino.cc/reference/en/>
- <https://docs.arduino.cc/tutorials/>