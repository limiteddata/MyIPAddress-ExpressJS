var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var geoip = require('geoip-lite');
const publicIp = require('public-ip');
const { execSync } = require("child_process");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');
app.set('trust proxy', true)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async function(req, res, next) {
  res.render('index', { title:'index', ip: await publicIp.v4() });
});
app.get('/exact_hour', function(req, res, next) {res.render('exact_hour',{ title:'Exact Hour'});});
app.get('/traceroute', function(req, res, next) {res.render('traceroute',{ title:'traceroute'});});
app.get('/about', function(req, res, next) {res.render('about',{ title:'about'});});
app.get('/getLocation', async function(req, res, next) {

    var ip = await publicIp.v4();
    var geo = geoip.lookup(ip);
    locationData = {
      locationLatitude:geo.ll[0],
      locationLongitude:geo.ll[1]
    };
    return res.send(locationData)
});

app.post('/trace', function(req, res, next) {
    console.log('Starting trace');
    if ( req.body.hops == 0 ) req.body.hops = 1;
    let result = execSync(`tracert -h ${req.body.hops} ${req.body.hostname}`).toString().split('\n');
    var i = 4;
    var data = {
      title: req.body.hostname,
      results : []
    };
    while(true){
        if(i==result.length) break;
        var line = result[i].split(/\s+/);
        if(line.length == 2) break;
        data.results.push({
          id:line[1],
          time:line[2],
          unit:line[3],
          hostname:line[8],
          ipaddress:line[9]
        });
        i++;
    }
    return res.send(data)
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
