const Validator = require('jsonschema').Validator,
Promise = require('promise'),
fs = require('fs'),
path = require('path');

var schemas = {},
validator = new Validator();

function loadCIMSchema(dirname, resolve, reject) {
  // Loads all abb.*.json files as schemas.
  var fileLoadPromises =[];
  fs.readdir(dirname, function(err, files) {
    if (err) {
      console.log("Problem reading directory " + dirname);
      reject(err);
    }
    else {
      files.forEach(function(aFile) {

        if (aFile.indexOf(".json") > -1) {
          var fullPath = path.join(dirname, aFile);
          console.log("Loading schema definition from " + fullPath);

          function readSchemaDef(filePath) {
            return new Promise(function(resolv, rej) {
              fs.readFile(filePath, 'utf-8', function(err, data) {
                if (err) {
                  console.log("Problem reading " + filePath);
                  rej(err);
                }
                else {
                  var elems = path.parse(filePath);
                  var fn = elems.base;

                  try {
                    // console.log(data);
                    schemas[fn] = JSON.parse(data);
                  }
                  catch(err) {
                    if (err) {
                      console.log("Problem parsing schema definition from file " + filePath);
                      rej(err);
                    }
                  }

                  validator.addSchema(schemas[fn], '/' + fn);

                  resolv(schemas);
                }
              });
            });
          }

          var fileReadPromise = readSchemaDef(fullPath);

          fileLoadPromises.push(fileReadPromise);
        }
      });

      Promise.all(fileLoadPromises).done(function() {
        resolve(schemas);
      })
    }
  });
}

function checkJSONDocument(fileName) {
  fs.readFile(fileName, function(err, data) {
    if (err) {
      console.log("Problem loading JSON file " + fileName);
      return;
    }
    else {
      var doc = JSON.parse(data);
      var modelName = doc["model-metadata"]["model-name"];
      console.log("Loaded JSON document " + fileName + ", validating against model " + modelName + "...");
      var targetSchema = schemas[modelName];

      if (typeof targetSchema != "undefined") {
        console.log(validator.validate(doc, targetSchema));
      }
      else {
        console.log("There is no such schema found called " + modelName);
      }
    }
  })
}

var promise = new Promise(function(resolve, reject) {
  loadCIMSchema(process.argv[2], resolve, reject);
});

promise.done(function() {
  console.log("Schema definitions loading complete.");
  checkJSONDocument(process.argv[3])
})
