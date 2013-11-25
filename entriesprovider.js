var mongodb = require('mongodb');
var settings = require('./settings');
var Server = mongodb.Server;
var MongoClient = mongodb.MongoClient;
var mongoClient = new MongoClient(new Server(settings.mongoHost, settings.mongoPort));

var entries, counter;

mongoClient.open(function(err, mongoClient) {
  // must be a better way?
  if (err) throw err;

  var db = mongoClient.db(settings.mongoDb);
  entries = db.collection('entries');
  counter = db.collection('entriesCounter');
});

module.exports = {
  getCollection: function() {
    return entries;
  },
  getCounterCollection: function() {
    return counter;
  }
};
