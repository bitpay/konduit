var should = require('chai').should();
var expect = require('chai').expect;
var through = require('through');
var Pipeline = require('../lib/pipeline');

before(function(done) {
  done();
});

after(function(done) {
  done();
});

describe('Pipeline', function() {

  var pl = null;
  var bus = {
    pub: function(ns, data) { bus.sent++ },
    sub: function(ns, handler) {  },
    sent: 0
  };

  describe('@constructor', function() {

    it('should create a pipeline instance', function(done) {
      pl = new Pipeline({
        ipc: { publish: bus.pub, subscribe: bus.sub }
      });
      pl.should.instanceOf(Pipeline);
      done();
    });

    it('should use default options', function(done) {
      pl.options.log.should.equal(console);
      pl.options.ipc.namespace.should.equal('com.konduit.pipeline');
      expect(pl.options.ipc.publish).to.exist;
      expect(pl.options.ipc.subscribe).exist;
      done();
    });

    it('should inherit from stream.Duplex', function(done) {
      expect(pl.write).to.exist;
      expect(pl.read).to.exist;
      expect(pl.pipe).to.exist;
      done();
    });

  });

  describe('#use', function() {

    it('should fail to use an invalid "valve"', function(done) {
      try { pl.use() } catch (err) { expect(err).to.exist }
      try { pl.use(1) } catch (err) { expect(err).to.exist }
      try { pl.use('one') } catch (err) { expect(err).to.exist }
      try { pl.use(null) } catch (err) { expect(err).to.exist }
      done();
    });

    it('should add a valid "valve" to the pipeline', function(done) {
      pl.use(function(data) { this.queue(data) });
      expect(pl._pipeline).to.have.lengthOf(1);
      done();
    });

  });

  describe('#open', function() {

    it('should assemble the pipeline from 3 "valves"', function(done) {
      pl._pipeline = [];
      [0,0,0].forEach(function() {
        pl.use(function(data) {
          data.touched++;
          setTimeout(function() { this.queue(data) }.bind(this), 50);
        });
      });
      expect(pl._pipeline).to.have.lengthOf(3);
      pl.open();
      done();
    });

    it('should update the `readyState` property', function(done) {
      expect(pl.readyState).to.equal(1);
      done();
    });

    it('should provide async output from transformed input', function(done) {
      pl.once('data', function(data) {
        data.touched.should.equal(3);
        done();
      });
      pl.write({ touched: 0 });
    });

    it('should be pipeable to a writable stream', function(done) {
      var writable = through(function(data) { this.queue(data) });
      pl.pipe(writable).once('data', function(d) {
        pl.unpipe(writable);
        done();
      });
      pl.write({ touched: 0 });
    });

  });

  describe('#options.ipc', function() {

    it('should send messages using the configured ipc', function(done) {
      var sent = bus.sent;
      pl.write({ touched: 0 });
      expect(bus.sent).to.equal(sent + 1);
      done();
    });

  });

  describe('#close', function() {

    it('should disassemble the pipeline', function(done) {
      pl.close();
      expect(Object.keys(pl._events)).to.have.lengthOf(0);
      pl._pipeline.forEach(function(valve) {
        expect(Object.keys(valve._events)).to.have.lengthOf(0);
      });
      done();
    });

    it('should refuse to close a closed pipeline', function(done) {
      try { pl.close(); } catch (err) { expect(err).to.exist; done() }
    });

    it('should update the `readyState` property', function(done) {
      expect(pl.readyState).to.equal(0);
      done();
    });

  });

});
