'use strict';

const ConfigReader = function() {};

ConfigReader.prototype = {
  passphrase: 'testtest',
  gasPrice: '0x3B9ACA00',
  gas: 7500000,
  ZERO_BYTES: '0x0000000000000000000000000000000000000000000000000000000000000000',
  NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
  tokenHolderBalance: '1111',
  baseCurrencyCode: 'OST',
  conversionRate: 2,
  conversionRateDecimals: 18,
  requiredPriceOracleDecimals: 18,
  sessionKeySpendingLimit: 1000000,
  sessionKeyExpirationHeight: 100000000000,
  auxiliaryPort: 8546,
  workerExpirationHeight: '20000000'
};

module.exports = new ConfigReader();
