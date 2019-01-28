'use strict';

const testHelper = require('./helper');

let devEnvConfig = require(testHelper.configFilePath);

const ConfigReader = function() {};

ConfigReader.prototype = {
  deployerAddress: devEnvConfig.deployerAddress,
  organizationAddress: devEnvConfig.organizationAddress,
  wallet1: devEnvConfig.wallet1,
  wallet2: devEnvConfig.wallet2,
  ephemeralKey: devEnvConfig.ephemeralKey1,
  facilitatorAddress: devEnvConfig.facilitator,
  gethRpcEndPoint: devEnvConfig.gethRpcEndPoint,
  passphrase: 'testtest',
  gasPrice: '0x3B9ACA00',
  gas: 8000000
};

module.exports = new ConfigReader();
