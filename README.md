<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-poweredup

[![npm](https://img.shields.io/npm/v/homebridge-web-fan.svg)](https://www.npmjs.com/package/homebridge-web-fan) [![npm](https://img.shields.io/npm/dt/homebridge-web-fan.svg)](https://www.npmjs.com/package/homebridge-web-fan)

</span>

## Description

This [homebridge](https://github.com/homebridge/homebridge) plugin for exposing services and characteristics of nearby [LEGO PoweredUP HUBs](https://www.lego.com/en-us/themes/powered-up/about) as HomeKit accessories. Ideal for wireless DIY home automation projects if you'd like to control them comfortably with Siri on any Apple device.

## Installation

1. Install [homebridge](https://github.com/homebridge/homebridge#installation)
2. Install this plugin: `npm install -g homebridge-poweredup`
3. Update your `config.json` file

**You may need root access to use the BLE libraries required to use this plugin.**

## Configuration

```json
"accessories": [
   {
      "accessory": "PoweredUp trainMotor",
      "name": "Train",
      "uuid": "10242b090aaa",
      "hubType": "HUB NO.4",
      "deviceType": "TRAIN_MOTOR"
   }
]
```
* "accessory": is the name of the plugin and is required as is.
* "name": is the default name the hub will show up as in HomeKit.
* "uuid": is required and can be found after attempting to start the hub and looking at the logs.
