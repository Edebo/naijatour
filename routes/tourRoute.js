const router = require('express').Router();
const { protect, restrictedTo } = require('../controllers/authController');
const reviewsRoute = require('./reviewRoute');
const {
  getTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopFive,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getTourDistances
} = require('../controllers/tours');

// router.param('id',tourId)

// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictedTo('user'), createReview);

router.use('/:tourId/reviews', reviewsRoute);

router.route('/top-5-tours').get(aliasTopFive, getTours);
router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictedTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

//this api is to get tours within a particular distance in a particular unit
///tour-within?distance=233&center=-40,43& unit=
router
  .route('/tour-within/:distance/center/:latlong/unit/:unit')
  .get(getToursWithin);

router.route('/distance/:latlong/unit/:unit').get(getTourDistances);
router
  .route('/')
  .get(getTours)
  .post(protect, restrictedTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(protect, restrictedTo('admin', 'lead-guide'), updateTour)
  .delete(protect, restrictedTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
