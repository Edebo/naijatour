const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

const app = express();

//error handling features
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//security middleware:setting http headers
app.use(helmet());
//logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//for preventing bruteforce attack and DOS
//limiting number of request from the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from an IP,Please try again in an hour'
});

app.use('/api', limiter);

//add incoming json object to the req object
//body-parser reading data from the body
app.use(express.json());

//data sanitization against noSQL query injection
app.use(mongoSanitize());
//data sanitization against XSS
app.use(xssClean());
//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//for serving statics files
app.use(express.static(path.join(__dirname, 'public')));

const userRoute = require('./routes/userRoute');
const tourRoute = require('./routes/tourRoute');
const reviewRoute = require('./routes/reviewRoute');

app.use('/api/v1/users', userRoute);
app.use('/api/v1/tours', tourRoute);
app.use('/api/vi/tours', reviewRoute);

//handling undefined route
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //     status:'fail',
  //     message: `Can't find ${req.originalUrl} on this server`
  // })

  // const err = new Error(`Can't find ${req.originalUrl} on this server`)
  // err.status = 'fail'
  // err.statusCode = 404

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//global error handling middleware

app.use(globalErrorHandler);

module.exports = app;
