require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

process.on('uncaughtException', err => {
  console.log('uncaught exception handling');
  console.log(err.name, err.message);
  //server.close helps to finish handling all request before shutting down

  console.log(
    'handling Unhandled rejection. Now shutting down ... application'
  );
  process.exit(1);
});

//database connection
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('connection to database is successful');
  })
  .catch(err => {
    console.log('connection to database failed');
  });

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log('Server started successfully');
});

//this is for unhandled error:=>error outside express
process.on('unhandledRejection', err => {
  console.log('Unhandled rejection');
  console.log(err.name, err.message);
  //server.close helps to finish handling all request before shutting down
  server.close(() => {
    console.log(
      'handling Unhandled rejection. Now shutting down ... application'
    );
    process.exit(1);
  });
});

//this is handling uncaught error
