'use strict';

const path = require('path'),
  fs = require('fs');

const parseFile = function(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || 'utf8');
  return JSON.parse(fileContent);
};

const Abis = function() {};

Abis.prototype = {
  mockToken: parseFile('../../contracts/abi/MockToken.abi', 'utf8'),

  sampleCustomRule: parseFile('../../contracts/abi/TransferRule.abi', 'utf8')
};

module.exports = new Abis();
