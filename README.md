# NimbleConModule
Nimble Connectivity Module (Basic functions and library)

How to use:
Pendant and Actuator parameters are stored as structs with the following format:

struct Actuator
{
  bool present;

  // Signals from the actuator
  long positionFeedback;  // (range: -1000 to 1000) Errata: actuator delivered before January 2023 this signal always reads positive.
  long forceFeedback; // (range: -1000 to 1000)
  bool tempLimiting;  // Reads high if the actuator is thermally limiting its performance.
  bool sensorFault;   // Reads high if there's a fault in the position sensor.

  // Signals to the actuator
  long positionCommand; // (range: -1000 to 1000)
  long forceCommand;  // (range: 0 to 1000)
  bool activated; // Not used
  bool airOut;  // Set high to open air-out valve
  bool airIn;   // Set high to open air-in valve
};

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

Update the values in the structs with the desired values (either generated in the connectivity module or from some external source).

Data is sent to the actautor on a free-running basis. To disable, set forceCommand to 0.
Data from the actuator is updated in the actuator struct as new data is received. The readFromAct() function will return "1" if the data was updated, in case this is important to you.
Data from the pendant (if plugged in) is updated in the pendant struct as new data is received. The readFromAct() function will return "1" if the data was updated, in case this is important to you.
