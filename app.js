var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const { MongoClient } = require('mongodb');
const url = "mongodb+srv://dbUser:dbUser@cluster0.xroge.mongodb.net/dbUser?retryWrites=true&w=majority";
// const url = 'mongodb://localhost:27017/';
const dbName = 'Cluster0';
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var shorturlsRouter = require('./routes/shorturls');
var tokenRouter = require('./routes/token');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors({
  origin:"https://mystifying-villani-03a37f.netlify.app"
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/shorturls',shorturlsRouter);
app.use('/token',tokenRouter);

app.get('/:url',async (req,res)=>{
  try{
      let connection = await MongoClient.connect(url);
      let db = connection.db(dbName);
      let fullUrl = await db.collection("shortUrlCollection").find({"shortUrl":req.params.url}).toArray();
      db.collection("shortUrlCollection").updateOne({"shortUrl": req.params.url}, { $set: {"clicks": fullUrl[0].clicks+1}});
      connection.close();
      res.redirect(fullUrl[0].fullUrl);
  }
  catch(err){
      console.log(err);
  }
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
