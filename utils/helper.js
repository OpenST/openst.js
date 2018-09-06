'use strict';

const fs = require('fs'),
  path = require('path');

const Helper = function() {};

Helper.prototype = {
  getABI: function(contractName) {
    const oThis = this;
    let abiFileContent = oThis._read('../contracts/abi/' + contractName + '.abi');
    let abi = JSON.parse(abiFileContent);
    return abi;
  },

  getBIN: function(contractName) {
    const oThis = this;
    let binCode = oThis._read('../contracts/bin/' + contractName + '.bin');
    return binCode;
  },

  _read: function(filePath) {
    filePath = path.join(__dirname, '/' + filePath);
    return fs.readFileSync(filePath, 'utf8');
  }
};
module.exports = new Helper();
