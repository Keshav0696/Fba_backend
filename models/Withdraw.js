const mongoose = require('mongoose');


const withdrawSchema = new mongoose.Schema({
   vendor_id : {
       type : mongoose.Schema.Types.ObjectId,
       ref : 'User'
   },
   status :{ 
    type : String,
    required : ['pending', 'approved', 'rejected']
   },
   amount :{ 
       type : Number,
       required : true
   },
   total_price : {
    type : Number,
    required : true 
   }
});


module.exports = mongoose.model('Withdraw', withdrawSchema);