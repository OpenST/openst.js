/**
 * Sample Rule Execute
 */

// Load external packages
const chai = require('chai'),
  fs = require('fs'),
  assert = chai.assert;

const config = require('../test/utils/configReader'),
  abis = require('../test/utils/abis'),
  Web3WalletHelper = require('../test/utils/Web3WalletHelper'),
  OpenST = require('../index.js');

describe('test/deployer', () => {
  let openST,
    deployer,
    web3,
    abis = {},
    bins = {},
    wallets = [config.wallet1, config.wallet2],
    requirement = wallets.length,
    erc20Address,
    tokenRulesAddress,
    tokenHolderAddress;

  let validateReceipt = (receipt) => {
    assert.isNotNull(receipt, 'Transaction Receipt is null');
    assert.isObject(receipt, 'Transaction Receipt is not an object');
    assert.isTrue(receipt.status, 'Transaction failed.');
    return receipt;
  };

  let validateDeploymentReceipt = (receipt) => {
    validateReceipt(receipt);
    let contractAddress = receipt.contractAddress;
    assert.isNotEmpty(contractAddress, 'Deployment Receipt is missing contractAddress');
    assert.isTrue(web3.utils.isAddress(contractAddress), 'Invalid contractAddress in Receipt');
    return receipt;
  };

  before(() => {
    //Initialize openST
    openST = new OpenST(config.gethRpcEndPoint);

    //Get web3 from openST
    web3 = openST.web3();

    // Adding the addresses to the web3 wallet
    let web3WalletHelper = new Web3WalletHelper(openST.web3());

    //Create An Array of Promises.
    let allTasks = [];

    //Load keys into web3 wallet.
    allTasks.push(web3WalletHelper.init());

    //Read abi & bin files.

    return Promise.all(allTasks);
  });

  it('should create a new instance of openST.Deployer', () => {
    deployParams = {
      from: config.deployerAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    deployer = new openST.Deployer(deployParams);
  });

  it('should deploy ERC20Token', () => {
    return deployer
      .deployERC20Token()
      .then(validateDeploymentReceipt)
      .then((receipt) => {
        erc20Address = receipt.contractAddress;
      });
  });

  it('should deploy TokenRules', () => {
    let organizationAddress = config.organizationAddress;
    return deployer
      .deployTokenRules(organizationAddress, erc20Address)
      .then(validateDeploymentReceipt)
      .then((receipt) => {
        tokenRulesAddress = receipt.contractAddress;
      });
  });

  it('should deploy TokenHolder', () => {
    return deployer
      .deployTokenHolder(erc20Address, tokenRulesAddress, requirement, wallets)
      .then(validateDeploymentReceipt)
      .then((receipt) => {
        tokenHolderAddress = receipt.contractAddress;
      });
  });

  it('should deploy Simple Transfer Rule', () => {
    return deployer.deploySimpleTransferRule(tokenRulesAddress).then(validateDeploymentReceipt);
  });
});
