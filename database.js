let mongoose=require('mongoose');
require("dotenv").config();
mongoose.connect(process.env.MONGO_URL)
    .then(function(res){
        console.log("Database connection established");
    })
    .catch(function(err){
        console.log("Error in database connection");
    })

module.exports= mongoose;