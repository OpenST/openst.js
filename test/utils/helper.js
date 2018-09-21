'use strict';

const os = require('os');

const TestHelper = function() {};

TestHelper.prototype = {
  configFilePath: os.homedir() + '/openst-setup/config.json',

  gethDataDir: os.homedir() + '/openst-setup/origin-geth'
};

module.exports = new TestHelper();
