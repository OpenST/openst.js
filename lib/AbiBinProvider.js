'use strict';

//__NOT_FOR_WEB__BEGIN__
const fs = require('fs'),
  path = require('path');
//__NOT_FOR_WEB__END__

let DEFAULT_ABI_FOLDER_PATH, DEFAULT_BIN_FOLDER_PATH;
//__NOT_FOR_WEB__BEGIN__
DEFAULT_ABI_FOLDER_PATH = path.resolve(__dirname, '../contracts/abi/');
DEFAULT_BIN_FOLDER_PATH = path.resolve(__dirname, '../contracts/bin/');
//__NOT_FOR_WEB__END__

// const Linker = require('../libs/utils/linker'); check whether its needed

class AbiBinProvider {
  constructor(abiFolderPath, binFolderPath) {
    const oThis = this;
    console.log("Default path :- ",DEFAULT_ABI_FOLDER_PATH);
    abiFolderPath = abiFolderPath || DEFAULT_ABI_FOLDER_PATH;
    binFolderPath = binFolderPath || DEFAULT_BIN_FOLDER_PATH;
    //__NOT_FOR_WEB__BEGIN__
    if (!path.isAbsolute(abiFolderPath)) {
      let err = new Error('"abiFolderPath" is not Absolute. Please provide absolute path.');
      throw err;
    }
    if (!path.isAbsolute(binFolderPath)) {
      let err = new Error('"binFolderPath" is not Absolute. Please provide absolute path.');
      throw err;
    }
    //__NOT_FOR_WEB__END__

    oThis.abiFolderPath = abiFolderPath;
    oThis.binFolderPath = binFolderPath;
    oThis.custom = oThis.custom || null;
  }

  addABI(contractName, abiFileContent) {
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
  }

  addBIN(contractName, binFileContent) {
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
  }

  getABI(contractName) {
    const oThis = this;

    if (oThis.custom && oThis.custom[contractName] && oThis.custom[contractName].abi) {
      return oThis.custom[contractName].abi;
    }

    //__NOT_FOR_WEB__BEGIN__
    let fPath = path.resolve(oThis.abiFolderPath, contractName + '.abi');
    let abiFileContent = fs.readFileSync(fPath, 'utf8');
    let abi = JSON.parse(abiFileContent);
    //__NOT_FOR_WEB__END__
    return abi;
  }

  getBIN(contractName) {
    const oThis = this;

    if (oThis.custom && oThis.custom[contractName] && oThis.custom[contractName].bin) {
      return oThis.custom[contractName].bin;
    }

    //__NOT_FOR_WEB__BEGIN__
    let fPath = path.resolve(oThis.binFolderPath, contractName + '.bin');
    let bin = fs.readFileSync(fPath, 'utf8');
    if (typeof bin === 'string' && bin.indexOf('0x') != 0) {
      bin = '0x' + bin;
    }
    //__NOT_FOR_WEB__END__
    return bin;
  }

  //Note
  //links is an array of
  //Send as many libInfo as needed.
  //libInfo format:
  /*
  {
    "name": "NAME_OF_LIB",
    "address": "ADDRESS_OF_DEPLOYED_LIB"
  }
  */
  getLinkedBIN(contractName) {
    const oThis = this;
    let bin = oThis.getBIN(contractName);
    if (!bin) {
      return bin;
    }

    const libs = Array.from(arguments);
    libs.shift();
    let len = libs.length;
    let libraries = {};
    while (len--) {
      let libInfo = libs[len];
      if (typeof libInfo !== 'object' || !libInfo.name || !libInfo.address) {
        throw new Error('Invalid contract info argument at index ' + (len + 1));
      }
      libraries[libInfo.name] = libInfo.address;
    }
    return Linker.linkBytecode(bin, libraries);
  }

  _read(filePath) {
    //__NOT_FOR_WEB__BEGIN__
    filePath = path.join(__dirname, '/' + filePath);
    return fs.readFileSync(filePath, 'utf8');
    //__NOT_FOR_WEB__END__
  }

  static get Linker() {
    return Linker;
  }
}

module.exports = AbiBinProvider;
