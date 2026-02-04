# Prompt and Smell -- Arduino Firmware

Firmware for the Arduino Mega 2560 that drives 16 peristaltic pumps via
MOSFET motor driver boards. Receives serial commands from the Python
host controller using the protocol defined in `hardware/protocol.py`.

---

## Flashing the Firmware

### Prerequisites

- Arduino IDE 1.8.x or 2.x (https://www.arduino.cc/en/software)
- USB-A to USB-B cable
- Arduino Mega 2560 (genuine or compatible clone)

### Steps

1. Open `scent_controller.ino` in the Arduino IDE.
2. Select the board: **Tools > Board > Arduino Mega or Mega 2560**.
3. Select the port: **Tools > Port** and choose the COM port that appeared
   when you plugged in the Arduino (e.g., `COM3` on Windows, `/dev/ttyACM0`
   on Linux, `/dev/cu.usbmodem*` on macOS).
4. Click **Upload** (right-arrow button) or press `Ctrl+U`.
5. Wait for "Done uploading." in the status bar.
6. Open the Serial Monitor (**Tools > Serial Monitor**) and set the baud
   rate to **115200**. You should see:

   ```
   OK BOOT Prompt&Smell ScentController v1.0
   ```

### Alternative: Arduino CLI

```bash
# Install the Mega core if not already present
arduino-cli core install arduino:avr

# Compile
arduino-cli compile --fqbn arduino:mega:atmega2560 scent_controller.ino

# Upload (replace COM3 with your port)
arduino-cli upload -p COM3 --fqbn arduino:mega:atmega2560 scent_controller.ino

# Monitor
arduino-cli monitor -p COM3 --config baudrate=115200
```

---

## Pin Mapping

| Arduino Pin | MOSFET Board | Channel | Pump | Ingredient                 |
|-------------|-------------|---------|------|----------------------------|
| D22         | Board 1 CH1 | 0       | P0   | Ethanol (denatured)        |
| D23         | Board 1 CH2 | 1       | P1   | Dipropylene Glycol (DPG)   |
| D24         | Board 1 CH3 | 2       | P2   | Isopropyl Myristate (IPM)  |
| D25         | Board 1 CH4 | 3       | P3   | Bergamot Oil               |
| D26         | Board 1 CH5 | 4       | P4   | Linalool                   |
| D27         | Board 1 CH6 | 5       | P5   | Hedione                    |
| D28         | Board 1 CH7 | 6       | P6   | Rose Absolute              |
| D29         | Board 1 CH8 | 7       | P7   | Jasmine Absolute           |
| D30         | Board 2 CH1 | 8       | P8   | Iso E Super                |
| D31         | Board 2 CH2 | 9       | P9   | Cedarwood Oil (Atlas)      |
| D32         | Board 2 CH3 | 10      | P10  | Sandalwood Oil             |
| D33         | Board 2 CH4 | 11      | P11  | Vanillin (in DPG)          |
| D34         | Board 2 CH5 | 12      | P12  | Ambroxan (in DPG)          |
| D35         | Board 2 CH6 | 13      | P13  | Galaxolide                 |
| D36         | Board 2 CH7 | 14      | P14  | Patchouli Oil              |
| D37         | Board 2 CH8 | 15      | P15  | Dihydromyrcenol            |
| D13         | --          | --      | --   | Status LED (blinks active) |

### Power Connections

| Connection              | Source                         |
|-------------------------|--------------------------------|
| Arduino 5V              | USB from host computer         |
| MOSFET Board Logic VCC  | Arduino 5V pin                 |
| MOSFET Board Motor V+   | 12V 15A switching power supply |
| All GND                 | Common ground bus              |

---

## Serial Monitor Testing Commands

Open the Arduino IDE Serial Monitor (or any serial terminal) at **115200 baud**,
line ending set to **Newline**. Send the following commands to test. Each
command includes the required `*XX` checksum suffix.

### Generating Checksums

The checksum is the XOR of all ASCII bytes in the payload (everything before
the space and asterisk), encoded as two uppercase hex characters. You can
compute it with Python:

```python
def checksum(payload):
    xor = 0
    for ch in payload:
        xor ^= ord(ch)
    return f"{xor:02X}"
```

### Test Commands (pre-computed)

| Command to Send                | Description                          |
|--------------------------------|--------------------------------------|
| `START *34`                    | Begin dispensing session             |
| `PUMP 0 1000 *14`             | Run pump 0 for 1 second             |
| `PUMP 3 500 *62`              | Run pump 3 for 500ms                |
| `PUMP 15 2000 *20`            | Run pump 15 for 2 seconds           |
| `WAIT 1000 *2E`               | Wait 1 second                       |
| `FLUSH *02`                   | Flush all lines (2 seconds)         |
| `STATUS *10`                  | Query controller status              |
| `CALIBRATE 0 *00`             | Calibrate pump 0 (10 second run)    |
| `STOP *15`                    | Emergency stop all pumps             |

To generate your own checksums interactively:

```python
python -c "
payload = input('Payload: ')
xor = 0
for ch in payload:
    xor ^= ord(ch)
print(f'{payload} *{xor:02X}')
"
```

### Expected Responses

```
START *34        ->  OK READY
PUMP 0 1000 *14  ->  OK PUMP 0 1000
WAIT 500 *2B     ->  OK WAIT 500
FLUSH *02        ->  OK FLUSH
STOP *15         ->  OK STOPPED
STATUS *10       ->  OK STATUS {"session":true,"active":[0,0,...], ...}
CALIBRATE 3 *53  ->  OK CALIBRATE 3
```

Error examples:
```
BOGUS *FF        ->  ERR 02 CHECKSUM_FAIL   (wrong checksum)
PUMP 20 1000 *XX ->  ERR 03 CHANNEL_OUT_OF_RANGE
PUMP 0 50000 *XX ->  ERR 04 INVALID_DURATION
FOOBAR *XX       ->  ERR 01 INVALID_COMMAND
```

---

## Firmware Behavior Details

### Non-Blocking Pump Timing

All pump timing uses `millis()` comparisons instead of `delay()`. This
means multiple pumps can run simultaneously, and the controller remains
responsive to serial commands (including emergency STOP) at all times.

### Safety Features

- **30-second maximum duration**: Any single PUMP command is capped at
  30,000 ms. Requests exceeding this limit receive `ERR 04 INVALID_DURATION`.
- **Emergency stop**: The STOP command immediately sets all 16 output pins
  LOW and terminates the session.
- **Checksum validation**: Every command must include a valid XOR checksum.
  Commands with invalid or missing checksums are rejected with
  `ERR 02 CHECKSUM_FAIL`.
- **Channel bounds checking**: Channels must be in the range 0-15.

### LED Indicator

Pin 13 (built-in LED on most Arduino boards) blinks at 4 Hz whenever any
pump is active or a calibration is in progress. It turns off when all
pumps are idle.

### Calibration Mode

The CALIBRATE command runs a single pump at a steady rate for 10 seconds.
This is used with the `calibration.py` script on the host side, which
measures the actual volume dispensed and computes a calibration factor.

---

## Troubleshooting

### No response after upload

1. Check that the Serial Monitor baud rate is set to **115200**.
2. Make sure line ending is set to **Newline** (not "No line ending").
3. Try pressing the Arduino reset button. You should see the boot message:
   `OK BOOT Prompt&Smell ScentController v1.0`
4. If using a clone board, you may need to install CH340 or CP2102 USB
   drivers depending on the USB-to-serial chip on the board.

### ERR 02 CHECKSUM_FAIL on every command

- Double-check your checksum calculation. The XOR is computed over the raw
  ASCII bytes of the payload string (e.g., `"START"`, `"PUMP 0 1000"`),
  not including the ` *XX` suffix.
- Make sure there is exactly one space before the asterisk.
- Use the Python checksum helper shown above to verify.

### Pumps do not run (command returns OK but no motor activity)

1. Check 12V power supply is connected and turned on.
2. Verify the common ground bus: Arduino GND, MOSFET driver GND, and PSU
   GND must all be connected together.
3. Check the MOSFET driver SIG input wiring to the correct Arduino pin.
4. Test the pin directly: in the Arduino IDE, upload a simple sketch that
   does `digitalWrite(22, HIGH); delay(2000); digitalWrite(22, LOW);` to
   verify the MOSFET driver and pump respond.
5. Check pump motor polarity. Swapped leads will run the pump in reverse
   (pulling air instead of liquid).

### Pump runs but no liquid flows

1. The pump may need priming. Run FLUSH a few times or manually run the
   pump for 30 seconds until liquid fills the tubing.
2. Check for air leaks at tubing connections.
3. Ensure the reservoir is not empty and the suction tube reaches the
   bottom of the liquid.
4. Check that tubing is not kinked or pinched.

### Erratic pump behavior or random activations

1. Add 10k pull-down resistors on the MOSFET gate inputs if not already
   present on the driver board. Floating gates cause random switching.
2. Keep signal wires away from motor power wires to reduce interference.
3. Add a 100uF electrolytic capacitor across the 12V motor power rail
   near each MOSFET driver board.

### Serial communication drops or garbles

1. Use a short, high-quality USB cable (under 1 meter preferred).
2. Do not run USB cable alongside 12V motor power cables.
3. If using a USB hub, try connecting directly to the computer.
4. On Linux, ensure your user is in the `dialout` group:
   `sudo usermod -a -G dialout $USER` (then log out and back in).

### Arduino resets when pumps start

This is typically caused by insufficient power filtering. When multiple
pumps start simultaneously, the current spike can cause a voltage dip on
the 5V rail.

1. Power the Arduino via USB only (do not share 5V from the motor PSU).
2. Add bulk capacitance (470-1000uF) on the 12V rail.
3. Ensure the 12V PSU is rated for the total pump current draw (at least
   10A for 16 pumps).

### Calibration values seem wrong

1. Use a precision scale (0.01g resolution) and weigh the dispensed liquid.
2. Ensure the pump has been primed and is running without air bubbles.
3. Run calibration 3 times and average the results.
4. Check that the reservoir liquid level is consistent between runs (head
   pressure affects peristaltic pump flow rate slightly).
