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

/**
 * It is used for deploying a contract.
 */
class DeployContract {
  /**
   * DeployContract constructor.
   *
   * @param contractName Contract name.
   * @param txObject Transaction object.
   * @param web3 Web3 object.
   * @param txOptions Tx options.
   * @constructor
   */
  constructor(contractName, txObject, web3, txOptions) {
    const oThis = this;

    oThis.contractName = contractName;
    oThis.txObject = txObject;
    oThis.txOptions = txOptions;
    oThis.web3 = web3;
  }

  /**
   * It deploys the contract.
   *
   * @returns Promise object.
   */
  async deploy() {
    const oThis = this;

    let receipt = null,
      transactionHash = null;

    let instance = await oThis.txObject
      .send(oThis.txOptions)
      .on('receipt', function(value) {
        receipt = value;
      })
      .on('transactionHash', function(value) {
        transactionHash = value;
      })
      .on('error', function(error) {
        return Promise.reject(error);
      });

    let contractAddress = null;

    contractAddress = instance.options.address;

    // checking if the contract was deployed at all.
    const code = await oThis.web3.eth.getCode(contractAddress);

    if (code.length <= 2) {
      return Promise.reject('Contract deployment failed. oThis.web3.eth.getCode returned empty code.');
    }

    return Promise.resolve({
      receipt: receipt,
      instance: instance
    });
  }
}

module.exports = DeployContract;
