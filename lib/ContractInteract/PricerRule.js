'use strict';

const Web3 = require('web3');
const Mosaic = require('@openstfoundation/mosaic.js');
const AbiBinProvider = require('./../AbiBinProvider');
const Contracts = require('../Contracts');

const Utils = require('../../utils/Utils');
const { EIP712TypedData } = Mosaic.Utils;
const ContractName = 'PricerRule';

/**
 * This library is used to interact with PricerRule contracts.
 */
class PricerRule {
  /**
   * Recovery class constructor.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param address delayedRecovery proxy contract address.
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

    this.contract = Contracts.getPricerRule(this.auxiliaryWeb3, this.address);

    if (!this.contract) {
      const err = new TypeError(`Could not load PricerRule contract for: ${this.address}`);
      return Promise.reject(err);
    }
  }
}

module.exports = PricerRule;
