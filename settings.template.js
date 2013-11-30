// Gyroscoper settings file

var settings = {};

settings.secret = ""; // replace with random string

settings.mongoHost = "127.0.0.1";
settings.mongoPort = 27017;
settings.mongoDb = "gyrodata";

settings.mobileAgentOnly = true
settings.requireAllAxis = true

// get a SHA256 hash
// to generate use the one-liner:
// require('crypto').createHash('sha256').update("password").digest("hex")
settings.password = "";

if (!settings.secret) {
  throw "You must set a secret";
}

module.exports = settings;
