'use strict';

const AbiBinProvider = require('../AbiBinProvider');
const Deployer = require('../../utils/deployContract');

const ContractName = 'TokenRules';

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
    let params = {};
    params.contractName = 'TokenRules';
    params.txObject = txObject;
    params.txOptions = txOptions;
    params.web3 = oThis.auxiliaryWeb3;

    txReceipt = await new Deployer(params).deploy();

    return txReceipt;
  }

  /**
   * Performs deployment of TokenRules contract.
   *
   * @param _organization Organization which holds all the keys needed to administer the economy.
   * @param _token EIP20 token contract address deployed for an economy.
   * @param txOptions Tx options.
   * @private
   */
  _deployRawTx(_organization, _token, txOptions) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    let args = [_organization, _token];

    const contract = new oThis.auxiliaryWeb3.eth.Contract(abi, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );
  }
}

module.exports = TokenRules;
