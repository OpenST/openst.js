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

const TxSender = require('./../../utils/TxSender'),
  AbiBinProvider = require('./../AbiBinProvider');

const tokenHolderContractName = 'TokenHolder';

/**
 * It consists of methods for a user's TokenHolder.
 */
class TokenHolder {
  /**
   * Constructor of TokenHolder.
   *
   * @param auxiliaryWeb3 Auxiliary web3 object.
   * @param tokenRules Token rules contract address.
   * @param tokenHolderProxy TokenHolder proxy address of a user.
   */
  constructor(auxiliaryWeb3, tokenRules, tokenHolderProxy) {
    const oThis = this;

    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.tokenRules = tokenRules;
    oThis.tokenHolderProxy = tokenHolderProxy;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * It is used to get call prefix of executeRule method in TokenHolder contract.
   *
   * @returns Encoded signature of executeRule method.
   */
  getTokenHolderExecuteRuleCallPrefix() {
    const oThis = this;

    const executeRuleHash = oThis.auxiliaryWeb3.utils.soliditySha3(
      'executeRule(address,bytes,uint256,uint8,bytes32,bytes32)'
    );
    const executeRuleCallPrefix = executeRuleHash.substring(0, 10);

    return executeRuleCallPrefix;
  }

  /**
   * It is used to execute executable data signed by a session key.
   *
   * @param data The payload of a function to be executed in the target contract.
   * @param nonce The nonce of an session key that was used to sign the transaction.
   * @param r `r` part of the signature.
   * @param s `s` part of the signature.
   * @param v `v` part of the signature.
   * @param txOptions Tx options.
   *
   * @returns Promise object.
   */
  async executeRule(data, nonce, r, s, v, txOptions) {
    const oThis = this;

    const txObject = oThis._executeRuleRawTx(oThis.tokenRules, data, nonce, r, s, v),
      receipt = await new TxSender(txObject, oThis.auxiliaryWeb3, txOptions).execute();

    return receipt;
  }

  /**
   * Private method which is used to execute executable data signed by a session key.
   *
   * @param to The target contract address the transaction will be executed upon.
   * @param data The payload of a function to be executed in the target contract.
   * @param nonce The nonce of an session key that was used to sign the transaction.
   * @param r `r` part of the signature.
   * @param s `s` part of the signature.
   * @param v `v` part of the signature.
   * @private
   */
  _executeRuleRawTx(to, data, nonce, r, s, v) {
    const oThis = this;

    const jsonInterface = oThis.abiBinProvider.getABI(tokenHolderContractName),
      contract = new oThis.auxiliaryWeb3.eth.Contract(jsonInterface, oThis.tokenHolderProxy);

    return contract.methods.executeRule(to, data, nonce, r, s, v);
  }
}

module.exports = TokenHolder;