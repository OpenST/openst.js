'use strict';

//__NOT_FOR_WEB__BEGIN__
const fs = require('fs'),
  path = require('path');
//__NOT_FOR_WEB__END__

const AbiBinProvider = function(abiFolderPath, binFolderPath) {
  const oThis = this;
  oThis.abiFolderPath = abiFolderPath || oThis.abiFolderPath;
  oThis.binFolderPath = binFolderPath || oThis.binFolderPath;
};

AbiBinProvider.prototype = {
  constructor: AbiBinProvider,
  custom: null,
  abiFolderPath: '../contracts/abi/',
  binFolderPath: '../contracts/bin/',
  addABI: function(contractName, abiFileContent) {
    const oThis = this;

    oThis.custom = oThis.custom || {};

    let abi;
    if (typeof abiFileContent === 'string') {
      //Parse it.
      abi = JSON.parse(abiFileContent);
    } else if (typeof abiFileContent === 'object') {
      abi = abiFileContent;
    } else {
      let err = new Error('Abi should be either JSON String or an object');
      throw err;
    }

    let holder = (oThis.custom[contractName] = oThis.custom[contractName] || {});
    if (holder.abi) {
      let err = new Error(`Abi for Contract Name ${contractName} already exists.`);
      throw err;
    }

    holder.abi = abi;
  },

  addBIN: function(contractName, binFileContent) {
    const oThis = this;

    oThis.custom = oThis.custom || {};

    if (typeof binFileContent !== 'string') {
      //Parse it.
      let err = new Error('Bin should be a string');
      throw err;
    }

    let holder = (oThis.custom[contractName] = oThis.custom[contractName] || {});
    if (holder.bin) {
      let err = new Error(`Bin for Contract Name ${contractName} already exists.`);
      throw err;
    }

    holder.bin = binFileContent;
  },

  getABI: function(contractName) {
    const oThis = this;

    if (oThis.custom && oThis.custom[contractName] && oThis.custom[contractName].abi) {
      return oThis.custom[contractName].abi;
    }

    //__NOT_FOR_WEB__BEGIN__
    let abiFileContent = oThis._read(oThis.abiFolderPath + contractName + '.abi');
    let abi = JSON.parse(abiFileContent);
    return abi;
    //__NOT_FOR_WEB__END__
  },

  getBIN: function(contractName) {
    const oThis = this;

    if (oThis.custom && oThis.custom[contractName] && oThis.custom[contractName].bin) {
      return oThis.custom[contractName].bin;
    }

    //__NOT_FOR_WEB__BEGIN__
    let binCode = oThis._read(oThis.binFolderPath + contractName + '.bin');
    return binCode;
    //__NOT_FOR_WEB__END__
  },

  _read: function(filePath) {
    //__NOT_FOR_WEB__BEGIN__
    filePath = path.join(__dirname, '/' + filePath);
    return fs.readFileSync(filePath, 'utf8');
    //__NOT_FOR_WEB__END__
  }
};

module.exports = AbiBinProvider;
