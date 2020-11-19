
const multer = require("multer");
const path = require("path");

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
  
      // Uploads is the Upload_folder_name 
      cb(null, "uploads")
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "-" + Date.now())
    }
  })
  
  const maxSize = 1 * 1000 * 1000;
  
  var upload = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {
  
      // Set the filetypes, it is optional 
      var filetypes = /json/;
      // var mimetype = filetypes.test(file.mimetype); 
  
      var extname = filetypes.test(path.extname(
        file.originalname).toLowerCase());
  
      if (!extname) {
        return cb(null, true);
      }
  
      cb("Error: File upload only supports the "
        + "following filetypes - " + filetypes);
    }
  
    // mypic is the name of file attribute 
  }).single("myfile");
  module.exports.upload = upload;