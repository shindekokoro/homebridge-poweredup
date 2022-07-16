<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-poweredup

[![npm](https://img.shields.io/npm/v/homebridge-poweredup.svg)](https://www.npmjs.com/package/homebridge-poweredup) [![npm](https://img.shields.io/npm/dt/homebridge-poweredup.svg)](https://www.npmjs.com/package/homebridge-poweredup)

</span>

## Description

This [homebridge](https://github.com/homebridge/homebridge) plugin for exposing services and characteristics of nearby [LEGO PoweredUP HUBs](https://www.lego.com/en-us/themes/powered-up/about) as HomeKit accessories. Ideal for wireless DIY home automation projects if you'd like to control them comfortably with Siri on any Apple device.

## Notes

This plugin has been tested using on a RaspberryPi 4 with a PoweredUP HUB and basic Train Motor.

## Installation

1. Install [homebridge](https://github.com/homebridge/homebridge#installation)
2. Install this plugin: `npm install -g homebridge-poweredup`
3. Update your `config.json` file

**You may need root access to use the BLE libraries required to use this plugin.**

## Configuration

```json
"accessories": [
   {
      "accessory": "PoweredUp hubMotor",
      "name": "Train",
      "uuid": "10242b090aaa",
      "motorPort": "B",
      "hubType": "HUB NO.4",
      "deviceType": "TRAIN_MOTOR"
   }
]
```
* "accessory": is the name of the plugin and is required as is.
* "name": is the default name the hub will show up as in HomeKit.
* "uuid": is required and can be found after attempting to start the hub and looking at the logs.
* "motorPort": is optional and will allow for your to put the motor on a different port. If not set defaulted to port A.
* "hubType": can be anything in the config, only used for HomeKit settings currently.
* "deviceType": can be anything in the config, only used for HomeKit settings currently.

## TO-DO

Potentially add support for other HUBs, Motors and accessories to do various routines outside of a LEGO PoweredUP Train. The libraries are mostly there thanks to the awesome work done at [node-poweredup](https://github.com/nathankellenicki/node-poweredup). I have a Boost Move Hub to do some additional testing.
