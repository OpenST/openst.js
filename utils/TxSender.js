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
 * It is used for sending a transaction.
 */
class TxSender {
  /**
   * Constructor of TxSender.
   *
   * @param txObject Transaction object.
   * @param web3 Web3 object.
   * @param txOptions Tx options.
   * @constructor
   */
  constructor(txObject, web3, txOptions) {
    const oThis = this;

    oThis.txObject = txObject;
    oThis.txOptions = txOptions;
    oThis.web3 = web3;
  }

  /**
   * It executes a transaction.
   *
   * @returns Transaction receipt.
   */
  async execute() {
    const oThis = this;

    let transactionHash = '';

    return oThis.txObject
      .send(oThis.txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('transactionHash = ' + transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log(`Transaction (${transactionHash}) consumed ${receipt.gasUsed} gas.`);
      })
      .on('error', (error) => {
        console.log(`Transaction (${transactionHash}) failed: ${error}`);
      });
  }
}

module.exports = TxSender;
