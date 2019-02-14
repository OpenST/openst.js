// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./AbiBinProvider');
const Mosaic = require('@openstfoundation/mosaic-tbd');
const Contracts = Mosaic.Contracts;

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
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.abibinProvider = new AbiBinProvider();
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
    oThis.auxiliaryWeb3 = Contracts._getWeb3(oThis.auxiliaryWeb3);
    const jsonInterface = oThis.abibinProvider.getABI('TokenRules');
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
    oThis.auxiliaryWeb3 = Contracts._getWeb3(oThis.auxiliaryWeb3);
    const jsonInterface = oThis.abibinProvider.getABI('PricerRule');
    const contractInstance = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, contractAddress, txOptions);
    return contractInstance;
  }

  /**
   * Static method which returns delayed recovery module instance.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param address Delayed recovery module contract address.
   * @param options Tx options object.
   * @returns {auxiliaryWeb3Object.eth.Contract}
   */
  static getDelayedRecovery(auxiliaryWeb3, address, options) {
    const auxiliaryWeb3Object = Contracts._getWeb3(auxiliaryWeb3);
    const jsonInterface = abiBinProvider.getABI('DelayedRecoveryModule');
    const contractInstance = new auxiliaryWeb3Object.eth.Contract(jsonInterface, address, options);
    return contractInstance;
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
