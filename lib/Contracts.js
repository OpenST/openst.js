'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./AbiBinProvider');
const { Contracts } = require('@openstfoundation/mosaic.js');

const abiBinProvider = new AbiBinProvider();

/**
 * The class exposes instance of different contracts. Dappy can use the
 * instances to call contract methods. This gives Dappy flexibility in calling
 * contract methods based on his use case.
 */
class OpenSTContracts extends Contracts {
  /**
   * Constructor OpenSTContracts.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   */
  constructor(auxiliaryWeb3) {
    super(null, auxiliaryWeb3);
    const oThis = this;
    oThis.auxiliaryWeb3 = Contracts._getWeb3(auxiliaryWeb3);
  }

  /**
   * Returns TokenRules instance.
   *
   * @param contractAddress TokenRules contract address.
   * @param txOptions Tx options.
   *
   * @returns {auxiliaryWeb3.eth.Contract}
   */
  TokenRules(contractAddress, txOptions) {
    const oThis = this;
    const jsonInterface = abiBinProvider.getABI('TokenRules');
    const contractInstance = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, contractAddress, txOptions);
    return contractInstance;
  }

  /**
   * Returns PricerRule instance.
   *
   * @param contractAddress PricerRule contract address.
   * @param txOptions Tx options.
   *
   * @returns {auxiliaryWeb3.eth.Contract}
   */
  PricerRule(contractAddress, txOptions) {
    const oThis = this;
    const jsonInterface = abiBinProvider.getABI('PricerRule');
    const contractInstance = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, contractAddress, txOptions);
    return contractInstance;
  }

  /**
   * Returns GnosisSafe instance
   *
   * @param contractAddress GnosisSafe proxy contract address.
   * @param txOptions Tx options.
   *
   * @returns {auxiliaryWeb3.eth.Contract}
   */
  GnosisSafe(contractAddress, txOptions) {
    const oThis = this;

    const jsonInterface = abiBinProvider.getABI('GnosisSafe');
    let contractInstance = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, contractAddress, txOptions);
    return contractInstance;
  }

  /**
   * Returns TokenHolder instance
   *
   * @param contractAddress TokenHolder contract address.
   * @param txOptions Tx options.
   *
   * @returns {auxiliaryWeb3.eth.Contract}
   */
  TokenHolder(contractAddress, txOptions) {
    const oThis = this;

    const jsonInterface = abiBinProvider.getABI('TokenHolder');
    let contractInstance = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, contractAddress, txOptions);
    return contractInstance;
  }

  /**
   * Static method which returns TokenRules contract instance.
   *
   * @param auxiliaryWeb3 Origin chain web3 object.
   * @param address TokenRules contract address.
   * @param options Tx options.
   * @returns {web3.eth.Contract} Contract instance.
   * @constructor
   */
  static getTokenRules(auxiliaryWeb3, address, options) {
    const jsonInterface = abiBinProvider.getABI('TokenRules');
    return new auxiliaryWeb3.eth.Contract(jsonInterface, address, options);
  }

  /**
   * Static method which returns PricerRule contract instance.
   *
   * @param auxiliaryWeb3 Origin chain web3 object.
   * @param address PricerRule contract instance.
   * @param options Tx options.
   * @returns {web3.eth.Contract} Contract instance.
   * @constructor
   */
  static getPricerRule(auxiliaryWeb3, address, options) {
    const jsonInterface = abiBinProvider.getABI('PricerRule');
    return new auxiliaryWeb3.eth.Contract(jsonInterface, address, options);
  }

  /**
   * Static method which returns TokenHolder contract instance.
   *
   * @param auxiliaryWeb3 Auxiliary chain web3 object.
   * @param address TokenHolder contract address.
   * @param options Tx options.
   * @returns {web3.eth.Contract} Contract instance.
   * @constructor
   */
  static getTokenHolder(auxiliaryWeb3, address, options) {
    const jsonInterface = abiBinProvider.getABI('TokenHolder');
    return new auxiliaryWeb3.eth.Contract(jsonInterface, address, options);
  }

  /**
   * Static method which returns GnosisSafe contract instance.
   *
   * @param auxiliaryWeb3 Auxiliary chain web3 object.
   * @param address GnosisSafe contract address.
   * @param options Tx options.
   * @returns {web3.eth.Contract} Contract instance.
   * @constructor
   */
  static getGnosisSafe(auxiliaryWeb3, address, options) {
    const jsonInterface = abiBinProvider.getABI('GnosisSafe');
    return new auxiliaryWeb3.eth.Contract(jsonInterface, address, options);
  }

  /**
   * Static method which returns delayed recovery module instance.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param address DelayedRecoveryModule contract address.
   * @param options Tx options object.
   * @returns {auxiliaryWeb3Object.eth.Contract}
   */
  static getDelayedRecovery(auxiliaryWeb3, address, options) {
    const jsonInterface = abiBinProvider.getABI('DelayedRecoveryModule');
    return new auxiliaryWeb3.eth.Contract(jsonInterface, address, options);
  }

  /**
   * Static method which returns UserWalletFactory contract instance.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param address UserWalletFactory contract address.
   * @param options Tx options object.
   * @returns {auxiliaryWeb3Object.eth.Contract}
   */
  static getUserWalletFactory(auxiliaryWeb3, address, options) {
    const jsonInterface = abiBinProvider.getABI('UserWalletFactory');
    return new auxiliaryWeb3.eth.Contract(jsonInterface, address, options);
  }

  /**
   * Static method which returns ProxyFactory contract instance.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param address ProxyFactory contract address.
   * @param options Tx options object.
   * @returns {auxiliaryWeb3Object.eth.Contract}
   */
  static getProxyFactory(auxiliaryWeb3, address, options) {
    const jsonInterface = abiBinProvider.getABI('ProxyFactory');
    return new auxiliaryWeb3.eth.Contract(jsonInterface, address, options);
  }

  /**
   * Static method which returns CreateAndAddModules contract instance.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param address CreateAndAddModules contract address.
   * @param options Tx options object.
   * @returns {auxiliaryWeb3Object.eth.Contract}
   */
  static getCreateAndAddModules(auxiliaryWeb3, address, options) {
    const jsonInterface = abiBinProvider.getABI('CreateAndAddModules');
    return new auxiliaryWeb3.eth.Contract(jsonInterface, address, options);
  }

  /**
   * Returns web3 instance. If web3 is string constructs web3 object from string.
   *
   * @param web3 Web3 object.
   *
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
