'use strict';

const os = require('os');

const TestHelper = function () {};

TestHelper.prototype = {
  configFilePath: os.homedir() + '/openst-setup/config.json'
};

module.exports = new TestHelper();