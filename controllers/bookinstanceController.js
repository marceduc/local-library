var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
var async = require('async');
var {body, validationResult} = require('express-validator/check');
var {sanitizeBody} = require('express-validator/filter');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
  BookInstance.find()
  .populate('book')
  .exec(function(err, list_bookinstances){
    if (err){return next(err);}
    res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
  });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

  BookInstance.findById(req.params.id)
  .populate('book')
  .exec(function(err,bookinstance){
    if (err){return next(err)}
    if (bookinstance == null){
      var err = new Error('Book Instance not found.')
      err.status(404);
      return(next(err))
    }
    res.render('bookinstance_detail',{title: 'Copy ' + bookinstance.book.title, bookinstance:bookinstance})
  });
}

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
  Book.find({},'title')
  .exec(function(err, books){
    if (err){return next(err) }
    res.render('bookinstance_form', {title:'Create BookInstance', book_list:books});
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

  // Validate fields.
  body('book', 'Book must be specified').isLength({min:1}).trim(),
  body('imprint', 'Imprint must be specified').isLength({min:1}).trim(),
  body('due_back', 'Invalid date').optional({checkFalsy:true}).isISO8601(),

  // Sanitize fields.
  sanitizeBody('book').escape(),
  sanitizeBody('imprint').escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').toDate(),

  //  Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the Validation Errors
    var errors = validationResult(req);

    // Create a BookInstance object with trimmed and escaped data.
    var bookinstance = BookInstance({
      book:req.body.book,
      imprint: req.body.imprint,
      statu:req.body.status,
      due_back:req.body.due_back
    });

    if (!errors.isEmpty()){
      // There are errors. Render form again with sanitized values and error message.
      Book.find({}, 'title')
      .exec(function(err, books, next){
        if(err){return next(err); }
        res.render('bookinstance_form', {title: 'Create BookInstance', book_list:books, selected_book: bookinstance.book._id, errors: errors.array()})
      });
    }
    else{
      // Data from form is valid.
      bookinstance.save(function(err){
        if (err){return next(err); }
        // Successful - redirect to new record.
        res.redirect(bookinstance.url);

      })
    }
  }

];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
  BookInstance.findById(req.params.id)
  .populate('book')
  .exec(function(err, bookinstance){
    if (err) {return next(err); }
    if (bookinstance==null){
      // No results.
      res.redirect('/catalog/bookinstances')
    }
    res.render('bookinstance_delete',{bookinstance:bookinstance} )
  })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
  BookInstance.findByIdAndRemove(req.body.bookinstanceid)
  .exec(function(err){
    if (err){return next(err); }
    res.redirect('/catalog/bookinstances');
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {

  async.parallel({
    bookinstance:function(callback){
      BookInstance.findById(req.params.id, callback)
    },
    books:function(callback){
      Book.find({},'title').exec(callback)
    },
  }, function(err, results){
    if (err) {return next(err); }
    // Success.
    res.render('bookinstance_form',{title:'Update Bookinstance', book_list:results.books, bookinstance:results.bookinstance})
  })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate fields.
  body('book', 'Book must be specified').isLength({min:1}).trim(),
  body('imprint', 'Imprint must be specified').isLength({min:1}).trim(),
  body('due_back', 'Invalid date').optional({checkFalsy:true}).isISO8601(),

  // Sanitize fields.
  sanitizeBody('book').escape(),
  sanitizeBody('imprint').escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').toDate(),

  //  Process request after validation and sanitization.
  (req, res, next) => {

      // Extract validation Errors
      var errors = validationResult(req);
      // Create bookinstance with escaped / trimmed data and old id
      var bookinstance = BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        statu: req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id
      });

    if (!errors.isEmpty()){
      // There are errors render form again with sanitized values / error message.
      Book.find({},'title', function(err, books){
        if (err){return next(err); }
        res.render('bookinstance_form',{title:'Update Bookinstance', book_list:books, bookinstance:bookinstance, errors:errors.array()});
      });
    }
    else{
      // Date from form is valid. Update record.
      BookInstance.findByIdAndUpdate(req.params.id,bookinstance, {}, function(err){
        if(err){return next(err); }
        res.redirect(bookinstance.url);
      });
    }
  }
]
