/**
* @module pipeline
*/

var stream = require('stream');
var events = require('events');
var util = require('util');
var through = require('through');
var extend = require('extend');

/**
* A stream of "activities" that flow through a handler pipeline.
* @constructor
* @param {object} options - a configuration object
*/
var Pipeline = function(options) {
  stream.Duplex.call(this, { objectMode: true });

  this.options = extend(true, Pipeline.DEFAULTS, options || {});
  this.readyState = 0; // 0: closed, 1: open

  this._pipeline = [];

  this.setMaxListeners(0); // unlimited listeners allowed

  this.options.ipc.subscribe(
    this.options.ipc.namespace,
    this._proxy.bind(this)
  );
};

Pipeline.DEFAULTS = {
  log: console, // must implement info(), warn(), error()
  ipc: {
    subscribe: function(ns, handler) { /* noop */ }, // handle ipc messages
    publish: function(ns, data) { /* noop */ }, // publish ipc messages
    namespace: 'com.konduit.pipeline'
  }
};

util.inherits(Pipeline, stream.Duplex);

/**
* Private read method for stream consumers
* #_read
* @param {number} size - number of bytes to read
*/
Pipeline.prototype._read = function(size) {
  // noop
};

/**
* Private write method for stream consumers
* #_write
* @param {buffer} chunk - number of bytes to read
* @param {string} encoding - number of bytes to read
* @param {function} callback - fired when finished writing
*/
Pipeline.prototype._write = function(object, encoding, callback) {
  if (this.readyState === 0) {
    throw new Error('Refusing to write to closed pipeline');
  }

  if (!object.NO_RELAY) {
    this.options.ipc.publish(this.options.ipc.namespace, object);
  }

  delete object.NO_RELAY;

  this._pipeline[0].write(object);
  callback();
};

/**
* Private proxy method to inform _write to not re-broadcast over ipc
* #_proxy
* @param {buffer} chunk - number of bytes to read
* @param {string} encoding - number of bytes to read
* @param {function} callback - fired when finished writing
*/
Pipeline.prototype._proxy = function(object) {
  if (this.readyState === 0) return;
  object.NO_RELAY = 1;
  this.write(object);
};

/**
* Registers a pipeline "valve" as a transform stream
* #use
* @param {function} transformer - transform function passed to "through" module
*/
Pipeline.prototype.use = function(transformer) {
  if (typeof transformer !== 'function') {
    throw new TypeError('Pipeline#use expects a function');
  }

  return this._pipeline.push(through(transformer));
};

/**
* Connects pipeline valves together and opens the stream
* #open
*/
Pipeline.prototype.open = function() {
  var self = this;

  if (this.readyState === 1) {
    throw new Error('Pipeline is already opened');
  }

  if (this._pipeline.length === 0) {
    throw new Error('Cannot open empty pipeline');
  }

  for (var v = 0; v < this._pipeline.length; v++) {
    var previousValve = this._pipeline[v - 1];
    var currentValve = this._pipeline[v];

    if (previousValve) {
      previousValve.pipe(currentValve);
    }
  }

  this._pipeline[this._pipeline.length - 1].on('data', function(data) {
    self.push(data);
  });

  this.readyState = 1;

  return this;
};

/**
* Disconnects pipeline valves from each other closes the stream
* #close
*/
Pipeline.prototype.close = function() {
  if (this.readyState === 0) {
    throw new Error('Pipeline is already closed');
  }

  for (var v = 0; v < this._pipeline.length; v++) {
    this._pipeline[v].removeAllListeners();
  }

  this.removeAllListeners();

  this.readyState = 0;

  return this;
};

module.exports = Pipeline;
