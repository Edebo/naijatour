const mongoose = require('mongoose');
const Tour = require('./tours');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty']
    },
    rating: {
      type: Number,
      max: 5,
      min: 1
    },
    tour: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, 'Review must belong to a tour'],
      ref: 'Tour'
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, 'Review must belong to a user '],
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { virtuals: true }, //to make sure the virtual properties are include when results are sent
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //     path:'tour',
  //     select:'name'
  // }).populate({
  //     path:'user',
  //     select:'name photo'
  // })
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

// reviewSchema.pre(/^find/,function(next){

//     next()
// })

reviewSchema.statics.calcAverageRating = async function(tourId) {
  const stats = await this.aggregrate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      rating: stats[0].nRating,
      ratingsQuantity: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      rating: 0,
      ratingsQuantity: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  //this.constructor is used because the Review model hasnt been created
  this.constructor.calcAverageRating(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  //remember findByIdAndUpdate and findByIdAndDelete both run findOne under the hood
  //so this middleware will run for both review update and delete
  //this is  refereing to the query not the document.so we need to get the document
  this.review = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function(next) {
  //we used this.review so as passobject from the pre middleware to the post middleware
  await this.review.constructor.calcAverageRating(this.review.tour);
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
