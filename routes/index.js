var express = require('express');
var router = express.Router(); // Un router de express es un MW que permite agrupar otros MWs de atención a rutas

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Quiz' });
});

// Pagina de creditos
router.get('/author', function(req, res, next) {
    res.render('author');
});

// Pagina de ayuda
router.get('/help', function(req, res, next) {
    res.render('help');
});

module.exports = router;
