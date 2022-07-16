const LEGO = require("node-poweredup");
const poweredUP = new LEGO.PoweredUP();
let Service, Characteristic;
let freshCache = {
  "lightOn": 0,
  //"light-brightness": 100,
  "lightHue": 0,
  "lightSaturation": 0,
  "motorOn": 0,
  "motorSpeed": 0,
  "motorDirection": 0
};

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-poweredup",
  "PoweredUp hubMotor", HubMotorAccessory);
};

// PoweredUp HUB with Basic TrainMotor and
// optional light accessory. "Functions as FAN"
function HubMotorAccessory(log, config, api) {
  this.log = log;
  this.config = config;
  this.homebridge = api;
  this.speeds = 5;

  // Create a cache for accessory setting all to off.
  this.stateCache = freshCache;
  this.lastCacheRefresh = 0;
}


HubMotorAccessory.prototype = {
  // This will flash an LED on PoweredUp HUB to verify
  identify: function(callback) {
    this.log("Identify requested!");
    callback();
  },
  getServices: function() {
    poweredUP.scan(); // Start scanning for hubs
    this.getHub();

    this.fanService = new Service.Fan();
    this.fanService
      .getCharacteristic(Characteristic.On)
      .on("get", this.getMotorOn.bind(this))
      .on("set", this.setMotorOn.bind(this));
    this.fanService
      .getCharacteristic(Characteristic.RotationSpeed)
      .setProps({
        minValue: 0,
        maxValue: 100,
        minStep: Math.floor(100 / this.speeds)
      })
      .on("get", this.getMotorSpeed.bind(this))
      .on("set", this.setMotorSpeed.bind(this));
    this.fanService
      .getCharacteristic(Characteristic.RotationDirection)
      .on("get", this.getMotorDirection.bind(this))
      .on("set", this.setMotorDirection.bind(this));

    // Light
    this.lightService = new Service.Lightbulb(this.light_name);
    this.lightService
      .getCharacteristic(Characteristic.On)
      .on("get", this.getLightOn.bind(this))
      .on("set", this.setLightOn.bind(this));
    // this.lightService
    //   .addCharacteristic(new Characteristic.Brightness)
    //   .on("get", this.getLightBrightness.bind(this))
    //   .on("set", this.setLightBrightness.bind(this));
    this.lightService
      .addCharacteristic(new Characteristic.Hue)
      .on("get", this.getLightHue.bind(this))
      .on("set", this.setLightHue.bind(this));
    this.lightService
      .addCharacteristic(new Characteristic.Saturation)
      .on("get", this.getLightSaturation.bind(this))
      .on("set", this.setLightSaturation.bind(this));

    var infoService = new Service.AccessoryInformation();
    infoService
      .setCharacteristic(Characteristic.Manufacturer, "LEGO Systems")
      .setCharacteristic(Characteristic.SerialNumber, "UUID" + this.config.uuid)
      .setCharacteristic(Characteristic.Model, this.config.hubType + " " + this.config.deviceType)
    //return [infoService, this.fanService];
    return [infoService, this.fanService, this.lightService];

  },
  getHub: function() {
    poweredUP.on("discover", async (hub) => { // Wait to discover hubs

        hub.on("attach", (device) => {
            this.log.debug(`Device ${device.typeName} attached to port ${device.portName}`);
        });

        await hub.connect(); // Connect to hub
        this.log(`Connected to ${hub.name} ${hub.uuid}`);
        if(this.config.uuid != hub.uuid){
          this.log('Hub does not match that in config, turning it off. Update config if that\'s not correct');
          this.log(`Copy the UUID for config "uuid": "${hub.uuid}"`);
          hub.shutdown();
        } else{
          // Set defaultPort unless one set in settings
          let defaultPort = getDefaultPort(hub.name);
          let motorPort = this.config.motorPort ? this.config.motorPort : defaultPort;
          this.hubMotor = await hub.waitForDeviceAtPort(motorPort);
          this.log(`Connected to ${this.hubMotor.typeName}.`);

          this.HUB_LED = await hub.waitForDeviceAtPort("HUB_LED");
          this.log(`Connected to ${this.HUB_LED.typeName}.`);
          this.stateCache["lightOn"] = 1;
        }

        hub.on("disconnect", () => {
            this.log(`Disconnected ${hub.name}`);

            // Clear stateCache and make sure motor and LED variables reset.
            this.stateCache = freshCache;
            this.hubMotor = null;
            this.HUB_LED = null;
        })

        hub.on("button", ({ event }) => {
            this.log.debug(`Green button press detected (Event: ${event})`);
            switch (event) {
              case 2:
                this.log(`Turning off ${hub.name}.`);
                hub.shutdown();
                break;
              default: hub.connect();
            }
        });

    });
  },

  getMotorCharacteristics: function(mode, callback) {
    if(!this.hubMotor){
      this.stateCache["motorOn"] = 0; // Tell HomeKit the 'fan' is off
    }
    this.stateCache[mode] = this.stateCache[mode];
    callback(null, this.stateCache[mode]);
  },
  setMotorCharacteristics: function(mode, value, callback) {
    if(!this.hubMotor){
      this.log.debug("Motor not connected yet, is the HUB powered...UP?");
      this.stateCache["motorOn"] = 0; // Tell HomeKit the 'fan' is off
    } else{
      this.stateCache[mode] = value;
      var motorSpeed = this.stateCache["motorDirection"] ? this.stateCache["motorSpeed"] * -1 : this.stateCache["motorSpeed"];
      this.log.debug(`${this.hubMotor.typeName} ${mode} ${value}`);

      if (mode == "motorOn" && !this.stateCache["motorOn"]){
        this.hubMotor.stop();
      } else {
        this.hubMotor.setPower(motorSpeed);
      }
    }
    callback()
  },
  getDeviceCharacteristics: function(mode, callback) {
    if(!this.HUB_LED){
      this.stateCache["lightOn"] = 0; // Tell HomeKit the light is off
    }
    this.stateCache[mode] = this.stateCache[mode];
    callback(null, this.stateCache[mode]);
  },
  setDeviceCharacteristics: function(mode, value, callback) {
    if(!this.HUB_LED){
      this.log.debug("LED not connected yet, is the HUB powered...UP?");
      this.stateCache["lightOn"] = 0; // Tell HomeKit the light is off
    } else{
      this.stateCache[mode] = value;
      this.log.debug(`${this.HUB_LED.typeName} ${mode} ${value}`);

      var lightValue = this.stateCache["lightOn"] ? 255 : 0;
      var color = HSVtoRGB(this.stateCache["lightHue"]/360,
                           this.stateCache["lightSaturation"]/100,
                           lightValue);
      this.HUB_LED.setRGB(color.r, color.g, color.b);
    }

    callback();
  },

  // Train(i.e.Fan) Functions
  getMotorOn: function(callback) {
    this.getMotorCharacteristics("motorOn", callback);
  },
  setMotorOn: function(value, callback) {
    this.setMotorCharacteristics("motorOn", value, callback);
  },
  getMotorSpeed: function(callback) {
    this.getMotorCharacteristics("motorSpeed", callback);
  },
  setMotorSpeed: function(value, callback) {
    this.setMotorCharacteristics("motorSpeed", value, callback);
  },
  getMotorDirection: function(callback) {
    this.getMotorCharacteristics("motorDirection", callback);
  },
  setMotorDirection: function(value, callback) {
    this.setMotorCharacteristics("motorDirection", value, callback);
  },
  // Lighting Functions
  getLightOn: function(callback) {
    this.getDeviceCharacteristics("lightOn", callback);
  },
  setLightOn: function(value, callback) {
    this.setDeviceCharacteristics("lightOn", value, callback);
  },
  // getLightBrightness: function(callback) {
  //   this.getDeviceCharacteristics("light-brightness", callback);
  // },
  // setLightBrightness: function(value, callback) {
  //   this.setDeviceCharacteristics("light-brightness", value, callback);
  // },
  getLightHue: function(callback) {
    this.getDeviceCharacteristics("lightHue", callback);
  },
  setLightHue: function(value, callback) {
    this.setDeviceCharacteristics("lightHue", value, callback);
  },
  getLightSaturation: function(callback) {
    this.getDeviceCharacteristics("lightSaturation", callback);
  },
  setLightSaturation: function(value, callback) {
    this.setDeviceCharacteristics("lightSaturation", value, callback);
  }
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {r: r, g: g, b: b};
}

function getDefaultPort(hubName){
  switch (hubName) {
    case 'Move Hub': return 'AB';
    case 'Train Base\x00        ': return 'MOTOR';
    default: return 'A';
  }
}
