
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var post = require('./routes/post');
var admin = require('./routes/admin');
var http = require('http');
var path = require('path');
var settings = require('./settings');
var engine = require('ejs-locals');

var app = express();

// all environments
app.engine('ejs', engine);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser(settings.secret));
app.use(express.session({secret: settings.secret}));
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
} else if ('production' == app.get('env')) {
  app.enable('trust proxy');
}

app.get('/', routes.index);
app.post('/post', post.post);
app.get('/admin', admin.index);
app.post('/admin/login', admin.login);
app.get('/admin/logout', admin.logout);
app.get('/admin/download', admin.download);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
