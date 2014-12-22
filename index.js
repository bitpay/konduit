/**
* @module konduit
*/

var Pipeline = require('./lib/pipeline');

/**
* Convenience method for invoking pipeline constructor
* #createPipeline
* @param {object} options - a configuration object
*/
module.exports.createPipeline = function(options) {
  return new Pipeline(options);
};

/**
* Reference to Pipeline constructor
* @constructor
* @param {object} options - a configuration object
*/
module.exports.Pipeline = Pipeline;
