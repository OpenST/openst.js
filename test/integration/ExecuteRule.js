const chai = require('chai'),
  Web3 = require('web3');

const TokenRule = require('../../lib/setup/TokenRules'),
  UserSetup = require('../../lib/setup/UserSetup'),
  config = require('../utils/configReader'),
  Web3WalletHelper = require('../utils/Web3WalletHelper'),
  Contracts = require('../../lib/Contracts');

const auxiliaryWeb3 = new Web3(config.gethRpcEndPoint),
  web3WalletHelper = new Web3WalletHelper(auxiliaryWeb3),
  assert = chai.assert;

let txOptions = {
  from: config.deployerAddress,
  gasPrice: config.gasPrice,
  gas: config.gas
};

let wallets;

describe('ExecuteRule', async function() {
  before(function() {
    this.timeout(60000);
    //This hook could take long time.
    return web3WalletHelper.init(auxiliaryWeb3).then(function(_out) {
      wallets = web3WalletHelper.web3Object.eth.accounts.wallet;

      return _out;
    });
  });

  it('Should deploy TokenRules contract', async function() {
    this.timeout(3 * 60000);
    // TODO Gulshan: Update with actual mocktoken and organization
    const mockToken = wallets[2].address,
      mockOrganization = wallets[1].address;
    const tokenRules = new TokenRule(auxiliaryWeb3);

    const response = await tokenRules.deploy(mockOrganization, mockToken, txOptions, auxiliaryWeb3);

    let contractInstance = Contracts.getTokenRules(auxiliaryWeb3, response.receipt.contractAddress, txOptions);

    // Verifying stored organization and token address.
    assert.strictEqual(mockToken, await contractInstance.methods.token().call(), 'Token address is incorrect');
    assert.strictEqual(
      mockOrganization,
      await contractInstance.methods.organization().call(),
      'Organization address is incorrect'
    );
  });

  it('Should deploy Gnosis MultiSig MasterCopy contract', async function() {
    this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const multiSigTxResponse = await userSetup.deployMultiSigMasterCopy(txOptions);
    assert.strictEqual(multiSigTxResponse.receipt.status, true);
  });

  it('Should deploy TokenHolder MasterCopy contract', async function() {
    this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const tokenHolderTxResponse = await userSetup.deployTokenHolderMasterCopy(txOptions);
    assert.strictEqual(tokenHolderTxResponse.receipt.status, true);
  });

  it('Should deploy UserWalletFactory contract', async function() {
    this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const userWalletFactoryResponse = await userSetup.deployUserWalletFactory(txOptions);
    assert.strictEqual(userWalletFactoryResponse.receipt.status, true);
  });
});
