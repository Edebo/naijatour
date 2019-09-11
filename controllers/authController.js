const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const cookieOptions = {
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  httpOnly: true
};

const signToken = id => {
  return jwt.sign({ id }, process.env.SECRET, {
    expiresIn: process.env.EXPIRE_TIME
  });
};

const sendLoginResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  //send token as cookies which will expire in a week
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user
    }
  });
};

exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  sendLoginResponse(newUser, 201, res);
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1)check if email and password exit

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //2)check if user exist and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //3) if everything is ok send token to user
  //   const token = jwt.sign({ id: user._id }, process.env.SECRET, {
  //     expiresIn: process.env.EXPIRE_TIME
  //   });
  //   res.status(201).json({
  //     status: 'success',
  //     token
  //   });
  sendLoginResponse(user, 201, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1) check is token is available
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ');
  }
  if (!token) {
    next(new AppError('You are not logged in', 401));
  }
  //2)verify token
  const decoded = await promisify(jwt.verify(token, process.env.SECRET));

  //3) check if user still exist

  const user = await User.findById(decoded.id);
  if (!user) {
    next(new AppError('The user belonging to this token', 401));
  }
  //4) check if user changed password after jwt was issue
  if (user.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(' user currently changed password,PLease login again', 401)
    );
  }

  //Grant access to protected route
  req.user = user;
  next();
});

exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.roles)) {
      return next(
        new AppError('You do not have permission to perform this action ', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(AppError('There is no user user with this email', 404));
  }

  //2)generate random reset token
  const resetToken = user.changePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3) send the reset
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forget your password? Submit a PATCH request with your new password and passwordConfirm
    to :${resetUrl}.\nIf you did not forget your password please ignore this mail`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10mins)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token message sent to'
    });
  } catch (e) {
    //if error occurred when mail is sent
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the mail', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //2)if token has not expired,and there is a user set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expire', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  const newUser = await user.save();
  //3)update changePasswordAt property of the user

  //4)log the user in send JWT

  sendLoginResponse(newUser, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) get user information from collection
  const user = await User.findOne({ _id: req.user._id }).select('+password');
  //2)check posted current user is correct
  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError('Your current Paasword is wrong', 401));
  }
  //3)if so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  const newUser = await user.save();
  //4)log in user

  sendLoginResponse(newUser, 200, res);
});
