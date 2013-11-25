var entriesProvider = require('../entriesProvider');
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

  if (!_.isArray(data.gyro) || !_.isArray(data.accel)) {
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
