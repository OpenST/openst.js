'use strict';

//__NOT_FOR_WEB__BEGIN__
const fs = require('fs'),
  path = require('path');
//__NOT_FOR_WEB__END__

const Mosaic = require('@openstfoundation/mosaic-tbd');
const AbiBinProvider = Mosaic.AbiBinProvider;

let DEFAULT_ABI_FOLDER_PATH, DEFAULT_BIN_FOLDER_PATH;
//__NOT_FOR_WEB__BEGIN__
DEFAULT_ABI_FOLDER_PATH = path.resolve(__dirname, '../contracts/abi/');
DEFAULT_BIN_FOLDER_PATH = path.resolve(__dirname, '../contracts/bin/');
//__NOT_FOR_WEB__END__

/**
 * The class provides getter to get ABIs and BINs for different contracts.
 * ABI and BIN files sit in contracts/abi, contracts/bin folder.
 */
class BtAbiBinProvider extends AbiBinProvider {
  constructor(abiFolderPath, binFolderPath, mosaicAbiFolderPath, mosaicBinFolderPath) {
    abiFolderPath = abiFolderPath || DEFAULT_ABI_FOLDER_PATH;
    binFolderPath = binFolderPath || DEFAULT_BIN_FOLDER_PATH;
    super(abiFolderPath, binFolderPath);

    const oThis = this;
    oThis.mosaicAbiBinProvider = new AbiBinProvider(mosaicAbiFolderPath, mosaicBinFolderPath);
  }

  /**
   * Getter to get ABI for a contract.
   * @param contractName Name of the contract.
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

module.exports = BtAbiBinProvider;
