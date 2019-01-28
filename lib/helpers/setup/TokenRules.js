'use strict';

const AbiBinProvider = require('../AbiBinProvider');

const ContractName = 'TokenRules';

/**
 * Helper method which performs deployment of Token Rules contract.
 */
class TokenRules {
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Performs deployment of TokenRules contract.
   *
   * @param _organization Organization which holds all the keys needed to administer the economy.
   * @param _token EIP20Token address.
   * @param txOptions Tx options.
   * @param auxiliaryWeb3 Auxiliary chain web3.
   */
  deploy(_organization, _token, txOptions, auxiliaryWeb3) {
    const oThis = this;

    const web3 = auxiliaryWeb3 || oThis.web3;

    let tx = oThis._deployRawTx(_organization, _token, txOptions, web3);

    console.log(`* Deploying ${ContractName} Contract`);
    let txReceipt;
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash for deployment of TokenRule:', transactionHash);

      })
      .on('error', function(error) {
        console.log('\t !! Error for deployment of TokenRules!!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt for deployment of TokenRules:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      }).then(function(instance) {
        oThis.address = instance.options.address;
        console.log(`\t - ${ContractName} Contract Address:`, oThis.address);
        return txReceipt;
      });
  }

  /**
   * Performs deployment of TokenRules contract.
   *
   * @param _organization Organization which holds all the keys needed to administer the economy.
   * @param _token EIP20Token address.
   * @param txOptions Tx options.
   * @param auxiliaryWeb3 Auxiliary chain web3.
   * @private
   */
  _deployRawTx(_organization, _token, txOptions, auxiliaryWeb3) {
    const oThis = this;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    let args = [_organization, _token];

    const contract = new web3.eth.Contract(abi, null, txOptions);

    return contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );
  }

  /**
   * Performs validation of configuration parameters.
   * @param config -  Configuration json.
   * @returns {boolean} - Returns true on successful validation.
   */
  static validateSetupConfig(config) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!config) {
      throw new Error('Mandatory parameter "config" missing. ');
    }

    if (!config.deployer) {
      throw new Error('Mandatory configuration "deployer" missing. Set config.deployer address');
    }

    if (!config.symbol) {
      throw new Error('Mandatory configuration "symbol" missing. Set config.symbol address');
    }

    if (!config.name) {
      throw new Error('Mandatory configuration "name" missing. Set config.name address');
    }

    return true;
  }

}

module.exports = TokenRules;
