'use strict';

const ConfigReader = function() {};

ConfigReader.prototype = {
  passphrase: 'testtest',
  gasPrice: '0x3B9ACA00',
  gas: 7500000,
  ZERO_BYTES: '0x0000000000000000000000000000000000000000000000000000000000000000',
  NULL_ADDRESS: '0x0000000000000000000000000000000000000000',
  senderTokenHolderBalance: '50000000000000000000000', // 50000 BTs
  baseCurrencyCode: 'OST',
  payCurrencyCode: 'USD',
  conversionRate: '10',
  conversionRateDecimals: '5',
  requiredPriceOracleDecimals: '18',
  eip20TokenDecimals: '18',
  sessionKeySpendingLimit: '1000000000000000000000', //1000 ethers
  sessionKeyExpirationHeight: '1000000000000000000',
  price: '20000000000000000', // $0.02 = 20*10^16
  acceptanceMargin: '1000000000000000000', // $1
  auxiliaryPort: 8546,
  workerExpirationHeight: '20000000'
};

module.exports = new ConfigReader();
