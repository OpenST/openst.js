'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./AbiBinProvider');
const Mosaic = require('@openstfoundation/mosaic-tbd');
const Contracts = Mosaic.Contracts;
let abibinProvider = new AbiBinProvider();

/**
 * The class exposes instance of different contracts. Dappy can use the
 * instances to call contract methods. This gives Dappy flexibility in calling
 * contract methods based on his use case.
 */
class OpenSTContracts extends Contracts {
  /**
   * Returns TokenRules contract instance.
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param address TokenRules contract address.
   * @param txOptions Tx options.
   * @returns {Object} Contract instance.
   */
  static getTokenRules(auxiliaryWeb3, address, txOptions) {
    auxiliaryWeb3 = Contracts._getWeb3(auxiliaryWeb3);
    const jsonInterface = abibinProvider.getABI('TokenRules');
    let contractInstance = new auxiliaryWeb3.eth.Contract(jsonInterface, address, txOptions);
    return contractInstance;
  }

  /**
   * Returns web3 instance. If web3 is string constructs web3 object from string.
   * @param web3 Web3 object.
   * @returns {Web3} Web3 object.
   * @private
   */
  static _getWeb3(web3) {
    if (web3 instanceof Web3) {
      return web3;
    }
    if (typeof web3 === 'string') {
      return new Web3(web3);
    }
    throw 'Invalid web3. Please provide an instanceof Web3(version: ' + Web3.version + ' )';
  }
}

module.exports = OpenSTContracts;
