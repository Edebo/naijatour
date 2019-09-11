const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A tour must have a name'],
      trim: true,
      maxlength: [
        40,
        'A tour name must a length less than or equal to 40 characters'
      ],
      minlength: [
        10,
        'A  tour name must have a greater than or equal to 10 characters'
      ]
      // validate: [validator.isAlpha, 'A tour name should contain only letters']
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating should be greater than or equals one'],
      max: [5, 'Rating should be less than or equals 5'],
      set: val => Math.round(val * 10) / 10 //this is to make the avg to 1 decimal point
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max group size']
    },
    difficulty: {
      type: 'String',
      required: [true, 'a tour must have a difficulty level'],
      enum: {
        values: ['easy', 'medium', 'diificult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          //this is a custom validation for mongoose
          //the object this only works when creating a new document.it doesnt work when updating
          return val < this.price; //it set priceDiscount if the walue we are planning to store < value stored in price
        },
        message: 'Discount price ({VALUE})should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'a tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'a tour must have a cover image']
    },
    images: [String],
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, //to make sure the virtual properties are include when results are sent
    toObject: { virtuals: true }
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//this is virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//DOCUMENT MIDDLEWARE.this runs before the save command create command
tourSchema.pre('save', function(next) {
  //the main aim of this middleware is to slugify the name of the tour
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function(next){
//     const guidePromise = this.guides.map( async id =>  await User.findById(id))

//    this.guides = await Promise.all(guidePromise);
//     next()
// })

// //this runs after the current document is saved

// tourSchema.post('save',function(doc,next) {
//     console.log(doc)
//     next()
// })

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.find().populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  //   console.log(`Query took ${Date.now() - this.start} milliseconds to run`);

  next();
});

// //AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { $secretTour: { $ne: true } } });
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
