// service for accessing entries in CSV form
var entriesProvider = require('./entriesProvider');
var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var _ = require('underscore');
var async = require('async');

var DATA_FOLDER = "./gyrodata";

// create folder if it doesn't exist
if (fs.existsSync(DATA_FOLDER)) {
  stat = fs.statSync(DATA_FOLDER);
  if (!stat.isDirectory()) {
    throw "Unable to open " + DATA_FOLDER + " as a directory";
  }
} else {
  fs.mkdirSync(DATA_FOLDER);
}

var writeEntry = function(entry, index, callback) {
  var writeCounter = 3;
  // generate meta file
  var metaFile = "";
  metaFile += "LogVersion: G6\n";
  metaFile += "TerminalType: " + entry.device + "\n";
  metaFile += "TerminalScreenHeight: " + entry.screenHeight + "\n";
  metaFile += "\n";
  metaFile += "Activity: walk\n";
  metaFile += "\n";
  metaFile += "Gender: " + entry.gender.toLowerCase() + "\n";
  metaFile += "Height(cm): " + Math.round(entry.height) + "\n";
  metaFile += "Weight(kg): " + Math.round(entry.weight) + "\n";
  metaFile += "Generation: " + entry.age;

  var fileWriteHandler = function(err) {
    if (err) {
      console.log("Error writing file: " + err.toString());
      writeCounter = 0;
      callback(err);
    }
    writeCounter--;
    if (writeCounter == 0) callback();
  };

  fs.writeFile(path.join(DATA_FOLDER, "GYRO" + index + ".meta"), metaFile, fileWriteHandler);

  // generate gyro/accel file
  var generateFile = function(filename, data, keys) {
    // convert data to CSV
    data = _.map(data, function(value) {
      var str = "";
      _.forEach(keys, function(k, i) {
        var val = value[k];
        str += (i == 0 ? "" : ",") + (val ? val : "");
      });
      return str;
    });
    fs.writeFile(path.join(DATA_FOLDER, filename), data.join("\n"), fileWriteHandler);
  };

  generateFile("GYRO" + index + "-acc.csv", entry.accel, ["time", "x", "y", "z"]);
  generateFile("GYRO" + index + "-gyro.csv", entry.gyro, ["time", "alpha", "beta", "gamma"]);
};

// downloads all entries that have not been downloaded
exports.downloadAll = function(callback) {
  var collection = entriesProvider.getCollection();
  collection.find({idx: null}).toArray(function(err, entries) {
    if (err) return callback(err);
    async.each(entries, exports.downloadEntry, callback);
  });
};

// downloads one entry
exports.downloadEntry = function(entry, callback) {
  var counter = entriesProvider.getCounterCollection();

  // we've already inserted the files
  if (entry.idx) return callback();

  counter.findAndModify({v: 1}, [], {$inc: {counter: 1}}, {
    new: true,
    upsert: true
  }, function(err, object) {
    if (err) return callback(err);

    // start index from 1000
    var count = object.counter + 1000;
    
    // write data
    writeEntry(entry, count, function(err) {
      if (err) return callback(err);
      // update our entry with new value
      var collection = entriesProvider.getCollection();
      collection.update({_id: entry._id}, {$set: {idx: count}}, {safe:true}, function(err) {
        if (err) return callback(err);
        callback();
      });
    });
  });
};

exports.downloadToZip = function(stream, callback) {
  fs.readdir(DATA_FOLDER, function(err, files) {
    if (err) return callback(err);
    var archive = archiver('zip');
    archive.pipe(stream);

    archive.on('error', function(err) {
      callback(err);
    });

    files = _.filter(files, function(file) { return file.indexOf(".swp") === -1 });

    _.forEach(files, function(file) {
      var readStream = fs.createReadStream(path.join(DATA_FOLDER, file));
      archive.append(readStream, { name: "data/" + file });
    });

    archive.finalize(callback);
  });
}
