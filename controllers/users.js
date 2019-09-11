const User = require('../models/users');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { getOne } = require('./factoryHandler');

const filterOBj = (obj, ...allowfields) => {
  const newObj = {};

  Object.keys(obj).forEach(el => {
    if (allowfields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = getOne(User);
exports.getUsers = catchAsync(async (req, res) => {});

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) check if posted data contains passsword reset
  if (req.body.password || req.body.password) {
    return next(
      AppError('Please use the route /updatePassword to update Password', 400)
    );
  }

  //2) Update user document
  const filterBody = filterOBj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(
    { _id: req.user._id },
    filterBody,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate({ _id: req.user._id }, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
