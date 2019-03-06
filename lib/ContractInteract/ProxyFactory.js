'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./../AbiBinProvider');
const Contracts = require('../Contracts');

const Utils = require('../../utils/Utils');
const ContractName = 'ProxyFactory';

/**
 * Class to interact with ProxyFactory contract.
 */
class ProxyFactory {
  /**
   * Constructor of UserWalletFactory.
   *
   * @param auxiliaryWeb3 Auxiliary chain web3 object.
   * @param address Gnosis safe proxy address of a user.
   */
  constructor(auxiliaryWeb3, address) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      const err = new TypeError("Mandatory Parameter 'auxiliaryWeb3' is missing or invalid.");
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(address)) {
      const err = new TypeError(`Mandatory Parameter 'address' is missing or invalid: ${address}.`);
      return Promise.reject(err);
    }

    this.auxiliaryWeb3 = auxiliaryWeb3;
    this.address = address;

    this.contract = Contracts.getProxyFactory(this.auxiliaryWeb3, this.address);

    if (!this.contract) {
      const err = new TypeError(`Could not load address contract for: ${this.address}`);
      return Promise.reject(err);
    }
  }

  /**
   * Deploys proxyFactory contract.
   *
   * @param {Web3} auxiliaryWeb3 Origin chain web3 object.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<ProxyFactory>} Promise containing the proxyFactory
   *                                  instance that has been deployed.
   */
  static async deploy(auxiliaryWeb3, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    const tx = ProxyFactory.deployRawTx(auxiliaryWeb3);

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new ProxyFactory(auxiliaryWeb3, address);
    });
  }

  /**
   * Method which returns Tx object to deploy proxyFactory contract.
   *
   * @param {auxiliaryWeb3} auxiliaryWeb3 Auxiliary chain web3 object.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(auxiliaryWeb3) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      throw new TypeError(`Mandatory Parameter 'auxiliaryWeb3' is missing or invalid: ${auxiliaryWeb3}`);
    }
    const abiBinProvider = new AbiBinProvider();
    const bin = abiBinProvider.getBIN(ContractName);

    const args = [];
    const contract = Contracts.getProxyFactory(auxiliaryWeb3);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }
}

module.exports = ProxyFactory;
