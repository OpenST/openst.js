'use strict';

//__NOT_FOR_WEB__BEGIN__
const fs = require('fs'),
  path = require('path');
//__NOT_FOR_WEB__END__

const AbiBinProvider = require('./../../lib/AbiBinProvider');

const mockAbiFolder = path.resolve(__dirname, './mock-contracts/abi');
const mockBinFolder = path.resolve(__dirname, './mock-contracts/bin');

/**
 * It is used to get abi and bin for mock contracts.
 */
class MockContractsDeployer {
  /**
   * Constructor of MockContractsDeployer.
   *
   * @param deployer Address which is used for deployment.
   * @param web3 Auxiliary chain web3.
   */
  constructor(deployer, web3) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.deployer = deployer;
    oThis.abiBinProvider = MockContractsDeployer.abiBinProvider();

    oThis.addresses = {};
  }

  /**
   * It deploys mock token contract.
   *
   * @param web3 Auxiliary chain web3 object.
   * @param txOptions Tx options.
   * @returns Promise object.
   */
  deployMockToken(web3, txOptions) {
    const oThis = this;
    return oThis.deploy('MockToken', web3, txOptions);
  }

  /**
   * It deploys mock gateway contract.
   *
   * @param web3 Auxiliary chain web3 object.
   * @param txOptions Tx options.
   * @returns Promise object.
   */
  deployMockGatewayPass(web3, txOptions) {
    const oThis = this;
    return oThis.deploy('MockGatewayPass', web3, txOptions);
  }

  /**
   * It deploys the contract.
   *
   * @param contractName Name for the contract to deploy.
   * @param web3 Auxiliary chain web3.
   * @param txOptions Tx options.
   * @returns Promise object.
   */
  deploy(contractName, web3, txOptions) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(contractName);
    const bin = abiBinProvider.getBIN(contractName);

    let defaultOptions = {
      from: oThis.deployer,
      gas: '7500000',
      gasPrice: '0x5B9ACA00'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    let args = [];
    const contract = new web3.eth.Contract(abi, null, txOptions);
    let tx = contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );

    console.log(`* Deploying ${contractName} Contract`);
    let txReceipt;
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .then(function(instance) {
        oThis.addresses[contractName] = instance.options.address;
        console.log(`\t - ${contractName} Contract Address:`, instance.options.address);
        return txReceipt;
      });
  }

  /**
   * Static method to get the instance of AbiBinProvider.
   *
   * @returns {OpenSTAbiBinProvider}
   */
  static abiBinProvider() {
    return new AbiBinProvider(mockAbiFolder, mockBinFolder);
  }
}

module.exports = MockContractsDeployer;
