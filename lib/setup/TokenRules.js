'use strict';

const AbiBinProvider = require('../AbiBinProvider');
const Deployer = require('../../utils/DeployContract');
const ContractName = 'TokenRules';

const Utils = require('../../utils/Utils');

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
    Utils.deprecationNotice('setup.TokenRules', 'Please use TokenRules ContractInteract!!!');
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
   *
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
