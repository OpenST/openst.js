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
   * @param _organization Organization which holds all the keys needed to administer the economy.
   * @param _token EIP20 token contract address deployed for an economy.
   * @param txOptions Tx options.
   * @returns {Object} - Transaction receipt.
   */
  async deploy(_organization, _token, txOptions) {
    const oThis = this;

    let txObject = oThis._deployRawTx(_organization, _token, txOptions);

    let txReceipt;

    txReceipt = await new Deployer(ContractName, txObject, oThis.auxiliaryWeb3, txOptions).deploy();

    return txReceipt;
  }

  /**
   * Performs deployment of TokenRules contract.
   *
   * @param _organization Organization which holds all the keys needed to administer the economy.
   * @param _token EIP20 token contract address deployed for an economy.
   * @private
   */
  _deployRawTx(_organization, _token) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    let args = [_organization, _token];

    const contract = new oThis.auxiliaryWeb3.eth.Contract(abi, null);

    return contract.deploy({
      data: bin,
      arguments: args
    });
  }
}

module.exports = TokenRules;
