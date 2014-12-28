/* jshint node: true, browser: true */
var Transform = require('stream').Transform;
var messages = require('../messages');
var util = require('util');
var _ = require('lodash');

function RawMessageHydrator() {
  Transform.call(this, {objectMode: true});
  this._hydrators = {};
}

util.inherits(RawMessageHydrator, Transform);

module.exports = RawMessageHydrator;

RawMessageHydrator.factory = function() {

  var hydratorStream = new RawMessageHydrator();

  hydratorStream.register('message', messages.Message.hydrate);
  hydratorStream.register('call', messages.Call.hydrate);
  hydratorStream.register('response', messages.Response.hydrate);

  return hydratorStream;

};

var p = RawMessageHydrator.prototype;

p.register = function(messageType, hydrator) {
  this._hydrators[messageType] = hydrator;
};

p._transform = function(data, encoding, cb) {

  if(!_.isObject(data) || !data.type) {
    return cb(new Error('Invalid raw message !'));
  }

  var hydrator = this._hydrators[data.type];

  if(!hydrator) {
    return cb(new Error('Couldn\'t find a hydrator for "' + data.type + '" message !'));
  }

  var message;
  try {
    message = hydrator(data);
  } catch(err) {
    return cb(err);
  }

  if(!(message instanceof messages.Message)) {
    return cb(new Error('Invalid hydrator result for message type "' + data.type + '" !'));
  }

  this.push(message);

  return cb();

};