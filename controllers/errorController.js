const AppError = require('../utils/appError');

//handling operatinal error:CASTERROR which handling invalid id
const handleCastError = err => {
  const message = `Invalid ${err.path}:${err.value}`;
  return AppError(message, 400);
};

//handling operatinal error duplicate error
const handleDuplicateError = err => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value ${value}.Please use another value`;
  return AppError(message, 400);
};

//handling operatinal error Validation error
const handleValidationError = err => {
  const errors = Object.values(err.errors).map(value => value.message);
  const message = `Invalid input data ${errors.join('. ')}`;
  return AppError(message, 400);
};

//handling jsonwebtokenwerror
const handleJsonWebTokenError = () => {
  return new AppError('Invalid token,Please login again', 401);
};

//handling jsonweb token expired error
const handleTokenExpiredError = () => {
  return new AppError('Your token has expired,Please login again', 401);
};

const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

const sendProdError = (err, res) => {
  if (err.isOperatinal) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    console.err('Error', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') {
      error => handleCastError(error);
    }

    //this is for duplicate error
    if (error.code === 11000) error => handleDuplicateError(error);

    if (error.name === 'ValidatorError') error => handleValidationError(error);

    // handling jwtwebtoken errors:jsonwebtokenerror and token has expired error

    if (error.name === 'JsonWebTokenError') handleJsonWebTokenError();

    if (error.name === 'TokenExpiredError') handleTokenExpiredError();

    sendProdError(err, res);
  }
};
