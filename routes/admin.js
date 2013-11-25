// Provides routes for admin interface
var entriesProvider = require('../entriesProvider');
var entryfiles = require('../entryfiles');
var settings = require('../settings');
var _ = require('underscore');

/*
 * GET /admin
 */
exports.index = function(req, res, next) {
  if (!req.session.isAdmin) {
    var invalidPassword = !!req.session.invalidPassword;
    req.session.invalidPassword = false;
    res.render('admin_login', { title: 'Gyroscoper Admin', invalidPassword: invalidPassword });
    return;
  }

  var downloadError = req.session.downloadError;
  req.session.downloadError = null;

  var collection = entriesProvider.getCollection();
  collection
    .find({})
    .sort({created_at: -1})
    .toArray(function(err, entries) {
      if (err) {
        next(err);
        return;
      }

      res.render('admin', { title: 'Gyroscoper Admin', entries: entries, _: _, downloadError: downloadError});
    });
};

/*
 * POST /admin/login
 */
exports.login = function(req, res, next) {
  // hash req password
  var hashedPassword = "";
  var password = req.body.password;
  if (req.body.password) {
    hashedPassword = require('crypto').createHash('sha256').update(password).digest('hex');
  }
  if (settings.password && settings.password === hashedPassword) {
    req.session.isAdmin = true;
  } else {
    req.session.invalidPassword = true;
  }
  res.redirect('/admin');
};

/*
 * GET /admin/logout
 */
exports.logout = function(req, res) {
  req.session.isAdmin = false;
  res.redirect('/admin');
}

/*
 * GET /admin/download
 */
exports.download = function(req, res) {
  if (!req.session.isAdmin) {
    res.redirect('/admin');
    return;
  }
  var handleError = function(err) {
    req.session.downloadError = err.toString();
    res.redirect('/admin');
  }
  // compile files and zip them up for download
  entryfiles.downloadAll(function(err) {
    if (err) return handleError(err);
    // zip and download
    res.set({
      'Content-Type': 'zip',
      'Content-Disposition': "attachment; filename=gyrodata.zip"
    });
    entryfiles.downloadToZip(res, function(err) {
      if (err) return handleError(err);
      console.log('files downloaded!');
    });
  });
}
