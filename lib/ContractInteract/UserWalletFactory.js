'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./../AbiBinProvider');
const Contracts = require('../Contracts');

const Utils = require('../../utils/Utils');
const ContractName = 'UserWalletFactory';

/**
 * The Class is used to interact with UserWalletFactory contract.
 */
class UserWalletFactory {
  /**
   * Constructor of UserWalletFactory.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {string} address Gnosis safe proxy address of a user.
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

    this.contract = Contracts.getUserWalletFactory(this.auxiliaryWeb3, this.address);

    if (!this.contract) {
      const err = new TypeError(`Could not load UserWalletFactory contract for: ${this.address}`);
      return Promise.reject(err);
    }
  }

  /**
   * Deploys UserWalletFactory master copy contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {Object} txOptions Tx options.
   *
   * @returns {Promise<UserWalletFactory>} Promise containing the UserWalletFactory
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

    const tx = UserWalletFactory.deployRawTx(auxiliaryWeb3);

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new UserWalletFactory(auxiliaryWeb3, address);
    });
  }

  /**
   * Method which returns Tx object to deploy UserWalletFactory contract.
   *
   * @param {Web3} auxiliaryWeb3 Auxiliary chain web3 object.
   *
   * @returns {Object} Raw transaction object.
   */
  static deployRawTx(auxiliaryWeb3) {
    if (!(auxiliaryWeb3 instanceof Web3)) {
      throw new TypeError(`Mandatory Parameter 'auxiliaryWeb3' is missing or invalid: ${auxiliaryWeb3}`);
    }
    const abiBinProvider = new AbiBinProvider();
    const bin = abiBinProvider.getBIN(ContractName);

    const args = [];
    const contract = Contracts.getUserWalletFactory(auxiliaryWeb3);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }
}

module.exports = UserWalletFactory;
