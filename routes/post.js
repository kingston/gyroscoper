
var _ = require('underscore');

/*
 * POST gyroscoper data.
 */

var validKeys = ['accel', 'gyro'];

sendError = function(res, message) {
  res.send({
    success: false,
    message: message
  });
}

exports.post = function(req, res, next) {
  var collection = entriesProvider.getCollection();
  // get data
  var data = req.body;
  if (!_.isObject(data)) {
    sendError(res, "No data provided");
    return;
  }

  // filter out invalid keys
  data = _.pick(data, validKeys);

  // verify gyro/accel data
  if (!_.isArray(data.gyro) || !_.isArray(data.accel)) {
    sendError(res, "Invalid data submitted");
    return;
  }

  var invalidData = false;
  var filterRawData = function(entries, valid) {
    entries = _.map(entries, function (entry) {
      // make sure only valid keys are there
      entry = _.pick(entry, valid);
      var validEntries = 0;
      _.each(entry, function (value, key) {
        if (value == null) {
          delete entry[key];
        } else {
          invalidData = invalidData || !_.isFinite(value);
          validEntries += 1;
        }
      });
      // ignore entries with no data other than time
      if (validEntries > 1) {
        return entry;
      } else {
        return null;
      }
    });

    return _.filter(entries, function(x) { return x; });

  }
  data.gyro = filterRawData(data.gyro, ['time', 'alpha', 'beta', 'gamma']);
  data.accel = filterRawData(data.gyro, ['time', 'x', 'y', 'z']);

  if (invalidData) {
    sendError(res, "Invalid data submitted");
    return;
  }

  // beef up the keys
  data.created_at = new Date();
  data.from_ip = req.ip;

  collection.insert(data, {w:1}, function(err, objects) {
    if (err) {
      sendError(res, "Unable to insert data");
      return;
    }

    console.log("successfully uploaded new sample");
    res.send({success: true});
  });
};
