// Gyroscoper settings file

var settings = {};

settings.secret = ""; // replace with random string

settings.mongoHost = "127.0.0.1";
settings.mongoPort = 27017;
settings.mongoDb = "gyrodata";

if (!settings.secret) {
  throw "You must set settings";
}

module.exports = settings;
