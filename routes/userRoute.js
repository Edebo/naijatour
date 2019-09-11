const router = require('express').Router();

const {
  updateMe,
  deleteMe,
  getMe,
  getUser,
  getAllUsers,
  deleteUser,
  updateUser,
  createUser
} = require('../controllers/users');

const {
  signup,
  signin,
  protect,
  restrictedTo,
  forgotPassword,
  resetPassword,
  updatePassword
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/sigin', signin);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

//the below middleware protects every other route after it
router.use(protect);
router.get('/me', getMe, getUser);
router.patch('/updatePassword', updatePassword);
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);

router
  .route('/')
  .get(getAllUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(protect, restrictedTo('admin', 'lead-guide'), deleteUser);

module.exports = router;
