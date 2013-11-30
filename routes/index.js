var settings = require('../settings');

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Gyroscoper', gyro_settings: settings });
};
