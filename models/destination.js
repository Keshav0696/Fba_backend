const mongoose = require('mongoose');

// var fs = require('fs');
// var lineList = fs.readFileSync('data_fba_warehouses.csv').toString().split('\n');
// lineList.shift(); // Shift the headings off the list of records.

// var schemaKeyList = ['code', 'address', 'city', 'state', 'zip_code', 'country', 'opened', 'type' ];

const destinationSchema = new mongoose.Schema({
    code : String,
    address : String,
    city : String,
    state : String,
    zip_code : String,
    country : String,
    opened : String,
    type : String,
    status  : {
        type : String,
        enum : ["active", "deactive"],
        default : "active"
       },      
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now
    }
});
var Destination = mongoose.model('Destination', destinationSchema)


// function queryAllEntries () {
//     Destination.find({}, function(err, qDocList) {
//         console.log(util.inspect(qDocList, false, 10));
//         process.exit(0);
//     });
// }



// Recursively go through list adding documents.
// (This will overload the stack when lots of entries
// are inserted.  In practice I make heavy use the NodeJS 
// "async" module to avoid such situations.)




// function createDocRecurse (err) {
//     if (err) {
//         console.log(err);
//         process.exit(1);
//     }
//     if (lineList.length) {
//         var line = lineList.shift();
//         var obj = {}
//         line.split(',').forEach(function (entry, i) {
//             obj[schemaKeyList[i]] = entry;
//         });
//         var doc = new Destination(obj);
//         doc.save(createDocRecurse);
//     } else {
//         // After the last entry query to show the result.
//         queryAllEntries();
//     }
// }
// setTimeout(async function(){
//    await Destination.remove({});
//     createDocRecurse(null);

// }, 5000)


