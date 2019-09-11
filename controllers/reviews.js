const Review = require('../models/review');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
// const APIFEATURE = require('../utils/apiFeature');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll
} = require('./factoryHandler');

exports.setTourUserId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;

  if (!req.body.user) req.body.user = req.users.id;
  next();
};

exports.getReviews = getAll(Review);
exports.createReview = createOne(Review);
exports.getReview = getOne(Review);
exports.updateReview = updateOne(Review);
exports.deleteReview = deleteOne(Review);
