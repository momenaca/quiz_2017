var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var partials = require('express-partials');
var flash = require('express-flash');
var methodOverride = require('method-override');

var index = require('./routes/index'); // Importar routers del directorio pasado como argumento

var app = express(); // Crear aplicación

// view engine setup
app.set('views', path.join(__dirname, 'views')); // Define el directorio de vistas
app.set('view engine', 'ejs'); // Instala renderizador de vistas EJS

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json()); // Instalar MWs que procesan partes de req o res
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: "Quiz 2017",
    resave: false,
    saveUninitialized: true}));
app.use(methodOverride('_method', {methods: ["POST", "GET"]}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(partials());
app.use(flash());

// Helper dinamico:
app.use(function(req, res, next) {

    // Hacer visible req.session en las vistas
    res.locals.session = req.session;

    next();
});

app.use('/', index); // Instalar MWs routers que atienden a las rutas específicas

// catch 404 and forward to error handler
app.use(function(req, res, next) { // Ningún MW anterior ha entendido la ruta y hay que enviar la respuesta "404 Not Found"
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error'); // Renderiza la vista de respuesta a errores
});

module.exports = app;
