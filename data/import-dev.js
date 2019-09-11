require('dotenv').config()
const fs = require('fs')
const mongoose = require('mongoose')
const Tour = require('../models/tours')

//database connection
const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)
mongoose.connect(DB,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useFindAndModify:false
}).then(()=>{
    
    console.log("connection to database is successful")
})

//read json file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`,'utf-8'))

console.log(tours)
//import data into database

const importData = async () => {
    try{
     await Tour.create(tours)
     console.log('created in database')
    }catch(err){
        console.log(err)
    }
}


//delete data from database
const deleteData = async () => {
        try{
        await Tour.deleteMany() 
        console.log('data successfully deleted')
        }catch(err){

        }
}


console.log(process.argv)
if(process.argv[2]==='--import'){
    importData()
}
else if(process.argv[2]==="--delete"){
    console.log("i got in delete data function")
    deleteData()
}

