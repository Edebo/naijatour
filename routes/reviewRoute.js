const express = require('express');

const router = express.Router({ mergeParams: true });
const {
  createReview,
  getReviews,
  deleteReview,
  updateReview,
  setTourUserId,
  getReview
} = require('../controllers/reviews');
const { protect, restrictedTo } = require('../controllers/authController');

router.use(protect);
router
  .route('/')
  .get(getReviews)
  .post(restrictedTo('user'), createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictedTo('user', 'admin'), setTourUserId, updateReview)
  .delete(restrictedTo('user', 'admin'), deleteReview);

module.exports = router;
