var imageCollectionSchema = require("../schemas/imageCollection.schema");
var diseaseSchema = require("../schemas/disease.schema");

const formidable = require("formidable");
const fileType = require("file-type");
const mv = require("mv");
const path = require("path");
var fs = require("fs");

var imageCollectionAPI = {
  store: (request, response) => {
    try {
      //get scientist id from fcm token
      const scientistId = request.user.user_id;

      var imageName = [];
      var err = 0;
      const files = [];
      const fields = [];

      //initialize formidable for multipart form data
      const formData = formidable.IncomingForm();
      formData.multiples = true;

      //get form text & file input
      formData
        .on("field", (fieldName, value) => {
          fields.push({ fieldName, value });
        })
        .on("file", async (fieldName, file) => {
          const pictureName =
            Math.floor(1000 + Math.random() * 9000) +
            "_" +
            Date.now() +
            "." +
            "png";
          files.push({ fieldName, file });
          imageName.push({ name: pictureName });

          const oldPath = file.path;
          const result = await fileType.fromFile(file.path);
          const allowedImageTypes = ["jpg", "jpeg", "png"];
          if (!allowedImageTypes.includes(result.ext)) {
            err = 1;
          }

          //get disease id from fields array
          var diseaseIdArray = fields.filter((e) => e.fieldName == "diseaseId");
          var dId = diseaseIdArray[0].value;
          //set image store path
          const newPathDirectory = path.join(
            __dirname,
            "../",
            "public",
            "Images",
            "diseaseImageCollection",
            dId
          );
          //check if folder exist, if not create new
          if (!fs.existsSync(newPathDirectory)) {
            fs.mkdirSync(newPathDirectory);
          }

          const newPath = path.join(
            __dirname,
            "../",
            "public",
            "Images",
            "diseaseImageCollection",
            dId,
            pictureName
          );

          files.push(pictureName);
          //move file
          mv(oldPath, newPath, async (error) => {
            if (error) {
              err = 1;
            } else {
            }
          });
        })
        .on("end", () => {
          console.log("---------------upload done :) ----------------------");
        });
      //get form data
      formData.parse(request, async (error, fields, files) => {
        //store in db
        var diseaseData = new imageCollectionSchema({
          scientistId: scientistId,
          diseaseId: fields.diseaseId,
          image: imageName,
        });
        if (err == 1) {
          return response.json({
            status: 304,
            message: "File formate not allowed ",
          });
        } else {
          await diseaseData.save((error) => {
            if (error) {
              response.status(500).json({ message: error.message });
            } else {
              if (diseaseData === null || diseaseData === undefined) {
                response.status(404).json({
                  status: 404,
                  message: "Disease information save failed",
                });
              } else {
                response.status(200).json({
                  status: 200,
                  message: "Disease information save successfully",
                  data: diseaseData,
                });
              }
            }
          });
        }
      });
    } catch (error) {
      response.status(500).json({ message: error.message });
    }
  },
};

module.exports = imageCollectionAPI;
