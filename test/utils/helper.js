'use strict';

const TestHelper = function(homeDir) {
  const oThis = this;

  oThis.homeDir = homeDir;

  oThis.configFilePath = homeDir + '/openst-setup/config.json';
  oThis.gethDataDir = homeDir + '/openst-setup/origin-geth';
};

TestHelper.prototype = {
  constructor: TestHelper,
  configFilePath: null,
  gethDataDir: null
};

const os = require('os');
module.exports = new TestHelper(os.homedir());
