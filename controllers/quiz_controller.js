var models = require("../models");
var Sequelize = require('sequelize');

var paginate = require('../helpers/paginate').paginate;
var array = [];
var session;

// Autoload el quiz asociado a :quizId
exports.load = function (req, res, next, quizId) {

    models.Quiz.findById(quizId)
    .then(function (quiz) {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('No existe ningún quiz con id=' + quizId);
        }
    })
    .catch(function (error) {
        next(error);
    });
};


// GET /quizzes
exports.index = function (req, res, next) {
    array.splice(0,array.length);
    var countOptions = {};

    // Busquedas:
    var search = req.query.search || '';
    if (search) {
        var search_like = "%" + search.replace(/ +/g,"%") + "%";

        countOptions.where = {question: { $like: search_like }};
    }

    models.Quiz.count(countOptions)
    .then(function (count) {

        // Paginacion:

        var items_per_page = 10;

        // La pagina a mostrar viene en la query
        var pageno = parseInt(req.query.pageno) || 1;

        // Crear un string con el HTML que pinta la botonera de paginacion.
        // Lo añado como una variable local de res para que lo pinte el layout de la aplicacion.
        res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);

        var findOptions = countOptions;

        findOptions.offset = items_per_page * (pageno - 1);
        findOptions.limit = items_per_page;

        return models.Quiz.findAll(findOptions);
    })
    .then(function (quizzes) {
        res.render('quizzes/index.ejs', {
            quizzes: quizzes,
            search: search
        });
    })
    .catch(function (error) {
        next(error);
    });
};


// GET /quizzes/:quizId
exports.show = function (req, res, next) {

    res.render('quizzes/show', {quiz: req.quiz});
};


// GET /quizzes/new
exports.new = function (req, res, next) {

    var quiz = {question: "", answer: ""};

    res.render('quizzes/new', {quiz: quiz});
};


// POST /quizzes/create
exports.create = function (req, res, next) {

    var quiz = models.Quiz.build({
        question: req.body.question,
        answer: req.body.answer
    });

    // guarda en DB los campos pregunta y respuesta de quiz
    quiz.save({fields: ["question", "answer"]})
    .then(function (quiz) {
        req.flash('success', 'Quiz creado con éxito.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, function (error) {

        req.flash('error', 'Errores en el formulario:');
        for (var i in error.errors) {
            req.flash('error', error.errors[i].value);
        }

        res.render('quizzes/new', {quiz: quiz});
    })
    .catch(function (error) {
        req.flash('error', 'Error al crear un Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = function (req, res, next) {

    res.render('quizzes/edit', {quiz: req.quiz});
};


// PUT /quizzes/:quizId
exports.update = function (req, res, next) {

    req.quiz.question = req.body.question;
    req.quiz.answer = req.body.answer;

    req.quiz.save({fields: ["question", "answer"]})
    .then(function (quiz) {
        req.flash('success', 'Quiz editado con éxito.');
        res.redirect('/quizzes/' + req.quiz.id);
    })
    .catch(Sequelize.ValidationError, function (error) {

        req.flash('error', 'Errores en el formulario:');
        for (var i in error.errors) {
            req.flash('error', error.errors[i].value);
        }

        res.render('quizzes/edit', {quiz: req.quiz});
    })
    .catch(function (error) {
        req.flash('error', 'Error al editar el Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = function (req, res, next) {

    req.quiz.destroy()
    .then(function () {
        req.flash('success', 'Quiz borrado con éxito.');
        res.redirect('/quizzes');
    })
    .catch(function (error) {
        req.flash('error', 'Error al editar el Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = function (req, res, next) {

    var answer = req.query.answer || '';

    res.render('quizzes/play', {
        quiz: req.quiz,
        answer: answer
    });
};


// GET /quizzes/:quizId/check
exports.check = function (req, res, next) {

    var answer = req.query.answer || "";

    var result = answer.toLowerCase().trim() === req.quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz: req.quiz,
        result: result,
        answer: answer
    });
};

// GET /randomplay
exports.randomplay = function (req, res, next) {
    session = req.session;

    models.Quiz.count()
        .then(function (count) {
            if(array.length == count) {
                res.render('quizzes/randomnomore',{
                    score: array.length
                })
            }
            else {
                if(!session.Id){
                    console.log("EMPIEZO");
                    quizId = Math.floor(Math.random()*count) + 1;
                    //quizId = 1; // Primer quiz
                }
                else{
                    //console.log("PRIMERA TRAZA 1   "+quizId);
                    var numValid = false;
                    var i = 0;
                    while(!numValid){ // Hasta que no sea un número válido no pasamos
                        if(i == count || array.length == 0) {
                            numValid = true;
                        }
                        else if(quizId == array[i]) {
                            quizId = Math.floor(Math.random()*count) + 1;
                            //console.log("PRIMERA TRAZA 2  "+quizId);
                            i = 0;
                        }
                        else {
                            //console.log("ARRAY: " + array[i]);
                            i++;
                        }
                    }
                    //console.log("PRIMERA TRAZA 3  "+quizId);
                }

                session.Id = quizId; // Guardamos el quizId

                models.Quiz.findById(quizId)
                    .then(function (quiz) {
                        if (quiz) {
                            res.render('quizzes/randomplay',{
                                quiz: quiz,
                                score: array.length
                            });
                        } else {
                            throw new Error('No existe ningún quiz con id=' + quizId);
                        }
                    })
            }
        })
};

// GET /quizzes/randomcheck/:quizId
exports.randomcheck = function (req, res, next) {
    var result = false;
    var punt = 0;
    models.Quiz.findById(req.params.quizId)
        .then(function (quiz) {
            if (quiz) {
                if(quiz.answer === req.query.answer) {
                    result = true;
                    if(session && session.Id) {
                        //console.log("SEGUNDA TRAZA   " + session.Id);
                        array.push(session.Id);
                    }
                    else {
                        punt = 1;
                    }
                }
                if(!result){
                    array.splice(0,array.length);
                }
                res.render('quizzes/randomresult',{
                    score: session ? array.length : punt,
                    result: result,
                    answer: req.query.answer
                })
            } else {
                throw new Error('No existe ningún quiz con id= ' + req.params.quizId);
            }
        })
};

//GET /pruebas
exports.sesiones = function (req, res, next) {
    res.write(array.toString());
    res.end();
}