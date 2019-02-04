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

const AbiBinProvider = require('../AbiBinProvider'),
  Deployer = require('../../utils/DeployContract'),
  ContractName = 'TokenRules';

/**
 * Helper method which performs deployment of Token Rules contract.
 */
class TokenRules {
  /**
   * Constructor for TokenRules.
   *
   * @param auxiliaryWeb3 Auxiliary chain web3 object.
   */
  constructor(auxiliaryWeb3) {
    const oThis = this;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Performs deployment of TokenRules contract.
   *
   * @param organization Organization which holds all the keys needed to administer the economy.
   * @param token EIP20 token contract address deployed for an economy.
   * @param txOptions Tx options.
   * @returns {Object} - Transaction receipt.
   */
  async deploy(organization, token, txOptions) {
    const oThis = this;

    let txObject = oThis._deployRawTx(organization, token);

    let txReceipt;

    txReceipt = await new Deployer(ContractName, txObject, oThis.auxiliaryWeb3, txOptions).deploy();

    return txReceipt;
  }

  /**
   * Performs deployment of TokenRules contract.
   *
   * @param organization Organization which holds all the keys needed to administer the economy.
   * @param token EIP20 token contract address deployed for an economy.
   * @private
   */
  _deployRawTx(organization, token) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    let args = [organization, token];

    const contract = new oThis.auxiliaryWeb3.eth.Contract(abi, null);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }
}

module.exports = TokenRules;
