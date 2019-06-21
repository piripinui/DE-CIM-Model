const Validator = require('jsonschema').Validator,
Promise = require('promise'),
fs = require('fs'),
path = require('path'),
commandLineArgs = require('command-line-args'),
commandLineUsage = require('command-line-usage');

const optionDefinitions = [
  { name: 'schemadir', alias: 'd', type: String },
  { name: 'instancefile', type: String },
  { name: 'schema', type: String },
  { name: 'help', type: Boolean}
],
options = commandLineArgs(optionDefinitions),
sections = [
  {
    header: 'schema-validator',
    content: 'Checks a JSON document using a JSON Schema document.'
  },
  {
    header: 'Options',
    optionList: [
      {
        name: 'schemadir',
        typeLabel: '{underline directory}',
        description: 'The directory where the schema definition JSON files are.'
      },
      {
        name: 'instancefile',
        typeLabel: '{underline file}',
        description: 'The file to validate using the JSON Schema.'
      },
      {
        name: 'schema',
        typeLabel: '{underline schemaname}',
        description: 'The name of schema to validate the instance file against (optional).'
      },
      {
        name: 'help',
        description: 'Print this usage guide.'
      }
    ]
  }
],
usage = commandLineUsage(sections);

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
      
      var modelName = ((options.schema) ? options.schema : doc["schema"]);

      if (modelName) {
        console.log("Loaded JSON document " + fileName + ", validating against model " + modelName + "...");
        var targetSchema = schemas[modelName];

        if (typeof targetSchema != "undefined") {
          console.log(validator.validate(doc, targetSchema));
        }
        else {
          console.log("There is no such schema found called " + modelName);
        }
      } else {
        console.log("Schema has to be defined in either data or as input to validator");
        console.log(usage);
      }
    }
  })
}

function init() {
  if (options.help) {
    console.log(usage);
  }
  else {
    if (options.schemadir && options.instancefile) {
      var promise = new Promise(function(resolve, reject) {
        loadCIMSchema(options.schemadir, resolve, reject);
      });

      promise.done(function() {
        console.log("Schema definitions loading complete.");
        checkJSONDocument(options.instancefile);
      });
    }
    else {
      console.log(usage);
    }
  };
}

init();
