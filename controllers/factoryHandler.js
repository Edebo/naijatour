const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFEATURE = require('../utils/apiFeature');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    if (!doc) {
      return next(new AppError('No tour found', 404));
    }
    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, populateOpt) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    let query = Model.findById(id);
    if (populateOpt) query = query.populate(populateOpt);
    // const tour=tours.find(el=>el.id==id)
    const doc = await query;

    if (!doc) {
      return next(new AppError('No tour found', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    //Build the query
    //1a)filtering
    //2)sorting the query
    //3) limiting fields
    //4)pagination
    //execute the query
    const feature = new APIFEATURE(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await feature.query;

    //send response
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
    // catch(err){
    //         console.log(err)
    //         res.status(404).json({
    //             status:'fail',
    //             message:"Internal Error"
    //         })
    //     }
    // }
  });
