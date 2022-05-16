const LEGO = require("node-poweredup");
const poweredUP = new LEGO.PoweredUP();
let Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-poweredup",
  "PoweredUp trainMotor", TrainMotorAccessory);
};

// PoweredUp HUB with Basic TrainMotor and
// optional light accessory. "Functions as FAN"
function TrainMotorAccessory(log, config, api) {
  this.log = log;
  this.config = config;
  this.homebridge = api;
  this.speeds = 5;

  this.stateCache = {
    "lightOn": 1,
    //"light-brightness": 100,
    "lightHue": 0,
    "lightSaturation": 0,
    "trainOn": 0,
    "trainSpeed": 0,
    "trainDirection": 0
  };
  this.lastCacheRefresh = 0;
}


TrainMotorAccessory.prototype = {
  // This will flash an LED on PoweredUp HUB to verify
  identify: function(callback) {
    this.log("Identify requested!");
    callback();
  },
  getServices: function() {
    poweredUP.scan(); // Start scanning
    this.getTrainHub()

    this.fanService = new Service.Fan();
    this.fanService
      .getCharacteristic(Characteristic.On)
      .on("get", this.getTrainOn.bind(this))
      .on("set", this.setTrainOn.bind(this));
    this.fanService
      .getCharacteristic(Characteristic.RotationSpeed)
      .setProps({
        minValue: 0,
        maxValue: 100,
        minStep: Math.floor(100 / this.speeds)
      })
      .on("get", this.getTrainSpeed.bind(this))
      .on("set", this.setTrainSpeed.bind(this));
    this.fanService
      .getCharacteristic(Characteristic.RotationDirection)
      .on("get", this.getTrainDirection.bind(this))
      .on("set", this.setTrainDirection.bind(this));

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
  getTrainHub: function() {
    poweredUP.on("discover", async (hub) => { // Wait to discover hubs

        hub.on("attach", (device) => {
            this.log.debug(`Device ${device.typeName} attached to port ${device.portName}`);
        });

        await hub.connect(); // Connect to hub
        this.log(`Connected to ${hub.name} ${hub.uuid}`);
        if(this.config.uuid != hub.uuid){
          this.log('Hub does not match that in config, turning it off. Update config if that\'s not correct');
          hub.shutdown();
        } else{
          this.trainMotor = await hub.waitForDeviceAtPort("A");
          this.log(`Connected to ${this.trainMotor.typeName}.`);

          this.HUB_LED = await hub.waitForDeviceAtPort("HUB_LED");
          this.log(`Connected to ${this.HUB_LED.typeName}.`);
        }

        // hub.on("disconnect", () => {
        //     this.log(`Disconnected ${hub.name}`);
        // })

        hub.on("button", ({ event }) => {
            this.log.debug(`Green button press detected (Event: ${event})`);
            switch (event) {
              case 2:
                hub.shutdown();
                this.log(`Turning off ${hub.name}.`)
                break;
              default: hub.connect();
            }
        });

    });
  },

  getTrainChar: function(mode, callback) {
    this.stateCache[mode] = this.stateCache[mode];
    callback(null, this.stateCache[mode]);
  },
  setTrainChar: function(mode, value, callback) {
    if(!this.trainMotor){
      this.log("Motor not connected yet, is the HUB powered...UP?");
      return;
    }
    this.stateCache[mode] = value;
    var trainSpeed = this.stateCache["trainDirection"] ? this.stateCache["trainSpeed"] * -1 : this.stateCache["trainSpeed"];
    this.log.debug(`${this.trainMotor.typeName} ${mode} ${value}`);

    if (mode == "trainOn" && !this.stateCache["trainOn"]){
      this.trainMotor.stop();
    } else {
      this.trainMotor.setPower(trainSpeed);
    }
    callback()
  },
  getDeviceChar: function(mode, callback) {
    this.stateCache[mode] = this.stateCache[mode];
    callback(null, this.stateCache[mode]);
  },
  setDeviceChar: function(mode, value, callback) {
    if(!this.HUB_LED){
      this.log("LED not connected yet, is the HUB powered...UP?");
      return;
    }
    this.stateCache[mode] = value;
    this.log.debug(`${this.HUB_LED.typeName} ${mode} ${value}`);

    var lightValue = this.stateCache["lightOn"] ? 255 : 0;
    var color = HSVtoRGB(this.stateCache["lightHue"]/360,
                         this.stateCache["lightSaturation"]/100,
                         lightValue);
    this.HUB_LED.setRGB(color.r, color.g, color.b);

    callback();
  },

  // Train(i.e.Fan) Functions
  getTrainOn: function(callback) {
    this.getTrainChar("trainOn", callback);
  },
  setTrainOn: function(value, callback) {
    this.setTrainChar("trainOn", value, callback);
  },
  getTrainSpeed: function(callback) {
    this.getTrainChar("trainSpeed", callback);
  },
  setTrainSpeed: function(value, callback) {
    this.setTrainChar("trainSpeed", value, callback);
  },
  getTrainDirection: function(callback) {
    this.getTrainChar("trainDirection", callback);
  },
  setTrainDirection: function(value, callback) {
    this.setTrainChar("trainDirection", value, callback);
  },
  // Lighting Functions
  getLightOn: function(callback) {
    this.getDeviceChar("lightOn", callback);
  },
  setLightOn: function(value, callback) {
    this.setDeviceChar("lightOn", value, callback);
  },
  // getLightBrightness: function(callback) {
  //   this.getDeviceChar("light-brightness", callback);
  // },
  // setLightBrightness: function(value, callback) {
  //   this.setDeviceChar("light-brightness", value, callback);
  // },
  getLightHue: function(callback) {
    this.getDeviceChar("lightHue", callback);
  },
  setLightHue: function(value, callback) {
    this.setDeviceChar("lightHue", value, callback);
  },
  getLightSaturation: function(callback) {
    this.getDeviceChar("lightSaturation", callback);
  },
  setLightSaturation: function(value, callback) {
    this.setDeviceChar("lightSaturation", value, callback);
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
