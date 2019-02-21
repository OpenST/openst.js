'use strict';

//__NOT_FOR_WEB__BEGIN__
const fs = require('fs'),
  path = require('path');
//__NOT_FOR_WEB__END__

const { AbiBinProvider } = require('@openstfoundation/mosaic.js');

let DEFAULT_ABI_FOLDER_PATH, DEFAULT_BIN_FOLDER_PATH;
//__NOT_FOR_WEB__BEGIN__
DEFAULT_ABI_FOLDER_PATH = path.resolve(__dirname, '../contracts/abi/');
DEFAULT_BIN_FOLDER_PATH = path.resolve(__dirname, '../contracts/bin/');
//__NOT_FOR_WEB__END__

/**
 * The class provides getter to get ABIs and BINs for different contracts.
 * ABI and BIN files sit in contracts/abi, contracts/bin folder.
 */
class OpenSTAbiBinProvider extends AbiBinProvider {
  /**
   * Constructor for OpenSTAbiBinProvider.
   *
   * @param {string} [abiFolderPath] Folder path where abi is present.
   * @param {string} [binFolderPath] Folder path where bin is present.
   */
  constructor(abiFolderPath, binFolderPath) {
    const abiDirectoryPath = abiFolderPath || DEFAULT_ABI_FOLDER_PATH;
    const binDirectoryPath = binFolderPath || DEFAULT_BIN_FOLDER_PATH;
    super();

    const oThis = this;
    oThis.mosaicAbiBinProvider = new AbiBinProvider();

    // add all ABIs from abiDirectoryPath
    fs.readdirSync(abiDirectoryPath).forEach((abiFile) => {
      const fPath = path.resolve(abiDirectoryPath, abiFile);
      const contractName = path.basename(abiFile, path.extname(abiFile));
      const contractAbi = JSON.parse(fs.readFileSync(fPath));
      oThis.addABI(contractName, contractAbi);
    });

    // add all bins from binDirectoryPath
    fs.readdirSync(binDirectoryPath).forEach((binFile) => {
      const fPath = path.resolve(binDirectoryPath, binFile);
      const contractName = path.basename(binFile, path.extname(binFile));
      const contractBin = fs.readFileSync(fPath, 'utf8');
      oThis.addBIN(contractName, contractBin);
    });
  }

  /**
   * Getter to get ABI for a contract.
   *
   * @param contractName Name of the contract.
   *
   * @returns {String} ABI JSON string.
   */
  getABI(contractName) {
    const oThis = this;
    let abi = null;
    try {
      abi = super.getABI(contractName);
    } catch (e) {
      //Just catch the exception. Do nothing.
    }

    if (!abi) {
      //We did not find abi in our location.
      //Lets get it from mosaicAbiBinProvider.
      return oThis.mosaicAbiBinProvider.getABI(contractName);
    }

    return abi;
  }

  /**
   * Getter to get BIN for a contract.
   * @param contractName Name of the contract.
   *
   * @returns {String} Binary string.
   */
  getBIN(contractName) {
    const oThis = this;
    let bin = null;
    try {
      bin = super.getBIN(contractName);
    } catch (e) {
      //Just catch the exception. Do nothing.
    }

    if (!bin) {
      //We did not find abi in our location.
      //Lets get it from mosaicAbiBinProvider.
      return oThis.mosaicAbiBinProvider.getBIN(contractName);
    }
    return bin;
  }
}

module.exports = OpenSTAbiBinProvider;
