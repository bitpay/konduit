Konduit
=======

[![Build Status](https://travis-ci.org/gordonwritescode/konduit.svg)](https://travis-ci.org/gordonwritescode/konduit)

A streaming middleware stack for inter-process event handling in Node.js.

## Usage

Install with Node Package Manager:

```
npm install konduit
```

### konduit.createPipeline([options])

Returns a new instance of `konduit.Pipeline`.

#### Options

* **log** - must implement `info`, `warn`, `debug`, and `error` methods
* **ipc.publish** - ipc publish method, takes args `(namespace, data)`
* **ipc.subscribe** - ipc subscribe method, takes args `(namespace, handler)`
* **ipc.namespace** - namespace to use for ipc messages

### Pipeline.use(valve)

Registers a middleware "valve" function used to create a
[through](https://www.npmjs.com/package/through) stream.

```js
pipeline.use(function(data) {
  data.foo = 'bar';
  this.queue(data);
});
```

### Pipeline.open()

Assembles registered "valves" into the pipeline and returns the `Pipeline`
instance.

### Pipeline.close()

Disassembles registered "valves" from the pipeline and returns the `Pipeline`
instance.

## Testing

Run the tests using Mocha:

```
npm install -g mocha
cd node_modules/konduit && npm test
```
