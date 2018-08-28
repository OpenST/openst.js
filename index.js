"use strict";

/**
 * Load openST Platform module
 */

const InstanceComposer = require('./instance_composer');
const version = require('./package.json').version;

require('./lib/Setup');

const OpenST = function (mosaic, openSTConfiguration) {
  const oThis = this;

  oThis.version = version;

  oThis.configurations = Object.assign({}, {mosaicObject: mosaic, openSTConfiguration: openSTConfiguration});

  const _instanceComposer =  new InstanceComposer(oThis.configurations);
  oThis.ic =  function () {
    return _instanceComposer;
  };

  oThis.setup = oThis.ic().Setup();
};

OpenST.prototype = {
  constructor: OpenST,
  configurations: null
};

module.exports = OpenST;