const Tour = require('../models/tours');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll
} = require('./factoryHandler');

exports.aliasTopFive = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getTours = getAll(Tour);

exports.createTour = createOne(Tour);

exports.getTour = getOne(Tour, { path: 'review' });

//deleting tours the a global delete function
exports.deleteTour = deleteOne(Tour);

exports.updateTour = updateOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlong, unit } = req.params;
  const [lat, long] = latlong.split(',');

  if (!lat && !long) {
    next(new AppError('Please specify the latitude and longitude', 400));
  }
  //radius of earth in miles is 3963.2 while in km is 639`
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[long, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTourDistances = catchAsync(async (req, res, next) => {
  const { latlong, unit } = req.params;
  const [lat, long] = latlong.split(',');

  if (!lat && !long) {
    next(new AppError('Please specify the latitude and longitude', 400));
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinate: [long * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      },
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});
