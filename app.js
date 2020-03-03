var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// var ejs = require('ejs');
var session = require('express-session');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
//配置解析普通表单post请求体
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// var multer = require('multer'); //删除图片临时放在'/tem/'
// app.use(multer({ dest: '/tem' }).array('image'));

app.use(session({
  secret: '12345',
  cookie: { maxAge: 1000 * 60 * 60 * 24 },  //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
  resave: false,
  saveUninitialized: true,
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// //解决跨域
// app.all('*', function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');  //设置允许跨域的域名，*代表允许任意域名跨域
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With');//允许的header类型
//   res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS'); //跨域允许的请求方式 
//   if (req.method == 'OPTIONS') {
//     res.send(200);//让options尝试请求快速结束
//   } else {
//     next();
//   }
// });
module.exports = app;
