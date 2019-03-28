'use strict';

const path = require('path');
const fs = require('fs');

const Package = require('../../index');

const { AbiBinProvider } = Package;
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
    return oThis.deploy('MockToken', web3, [], txOptions);
  }

  deployPriceOracle(web3, args, txOptions) {
    const oThis = this;
    return oThis.deploy('PriceOracle', web3, args, txOptions);
  }

  /**
   * It deploys the mock contract.
   *
   * @param contractName Name for the contract to deploy.
   * @param web3 Auxiliary chain web3.
   * @param args Deployment arguments.
   * @param txOptions Tx options.
   * @returns Promise object.
   */
  deploy(contractName, web3, args = [], txOptions) {
    const oThis = this;
    const web3Provider = web3 || oThis.web3;
    const { abiBinProvider } = oThis;
    const abi = abiBinProvider.getABI(contractName);
    const bin = abiBinProvider.getBIN(contractName);

    const defaultOptions = {
      from: oThis.deployer,
      gas: '7500000',
      gasPrice: '0x5B9ACA00'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const contract = new web3Provider.eth.Contract(abi, null, txOptions);
    const tx = contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );

    let txReceipt;
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {})
      .on('error', function(error) {
        return Promise.reject(error);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
      })
      .then(function(instance) {
        oThis.addresses[contractName] = instance.options.address;
        return txReceipt;
      });
  }

  /**
   * Static method to get the instance of AbiBinProvider.
   *
   * @returns {abiBinProvider}
   */
  static abiBinProvider() {
    const abiBinProvider = new AbiBinProvider();
    MockContractsDeployer.loadContracts(abiBinProvider, mockAbiFolder, mockBinFolder);
    return abiBinProvider;
  }

  static loadContracts(provider, abiFolderPath, binFolderPath) {
    if (!path.isAbsolute(abiFolderPath)) {
      throw new Error('"abiFolderPath" is not Absolute. Please provide absolute path.');
    }
    if (!path.isAbsolute(binFolderPath)) {
      throw new Error('"binFolderPath" is not Absolute. Please provide absolute path.');
    }

    // add all ABIs from abiFolderPath
    fs.readdirSync(abiFolderPath).forEach((abiFile) => {
      const contractName = path.basename(abiFile, path.extname(abiFile));
      const contractAbi = JSON.parse(fs.readFileSync(path.join(abiFolderPath, abiFile)));
      provider.addABI(contractName, contractAbi);
    });

    // add all bins from binFolderPath
    fs.readdirSync(binFolderPath).forEach((binFile) => {
      const contractName = path.basename(binFile, path.extname(binFile));
      const contractBin = fs.readFileSync(path.join(binFolderPath, binFile), 'utf8');
      provider.addBIN(contractName, contractBin);
    });
  }
}

module.exports = MockContractsDeployer;
