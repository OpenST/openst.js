const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index');

const TokenRulesSetup = Package.Setup.TokenRules,
  UserSetup = Package.Setup.User,
  Mosaic = require('@openstfoundation/mosaic-tbd'),
  config = require('../utils/configReader'),
  Web3WalletHelper = require('../utils/Web3WalletHelper'),
  Contracts = Package.Contracts,
  User = require('../../lib/User'),
  MockContractsDeployer = require('./../utils/MockContractsDeployer');

const auxiliaryWeb3 = new Web3(config.gethRpcEndPoint),
  web3WalletHelper = new Web3WalletHelper(auxiliaryWeb3),
  assert = chai.assert,
  OrganizationHelper = Mosaic.ChainSetup.OrganizationHelper;

let txOptions = {
  from: config.deployerAddress,
  gasPrice: config.gasPrice,
  gas: config.gas
};

let wallets,
  userWalletFactoryAddress,
  thMasterCopyAddress,
  gnosisSafeMasterCopyAddress,
  tokenRulesAddress,
  worker,
  organization,
  beneficiary,
  facilitator,
  deployer,
  mockToken,
  owner = config.deployerAddress;

describe('ExecuteRule', async function() {
  before(function() {
    this.timeout(60000);
    //This hook could take long time.
    return web3WalletHelper
      .init(auxiliaryWeb3)
      .then(function(_out) {
        if (!organization) {
          console.log('* Setting up Organization');
          wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
          worker = wallets[1].address;
          beneficiary = wallets[2].address;
          facilitator = wallets[3].address;
          let orgHelper = new OrganizationHelper(auxiliaryWeb3, organization);
          const orgConfig = {
            deployer: config.deployerAddress,
            owner: owner,
            workers: worker,
            workerExpirationHeight: '20000000'
          };
          return orgHelper.setup(orgConfig).then(function() {
            organization = orgHelper.address;
          });
        }
        return _out;
      })
      .then(function() {
        if (!mockToken) {
          deployer = new MockContractsDeployer(config.deployerAddress, auxiliaryWeb3);
          return deployer.deployMockToken().then(function() {
            mockToken = deployer.addresses.MockToken;
            return mockToken;
          });
        }
      });
  });

  it('Should deploy TokenRules contract', async function() {
    this.timeout(3 * 60000);

    const tokenRules = new TokenRulesSetup(auxiliaryWeb3);

    const response = await tokenRules.deploy(organization, mockToken, txOptions, auxiliaryWeb3);
    tokenRulesAddress = response.receipt.contractAddress;

    let contractInstance = Contracts.getTokenRules(auxiliaryWeb3, response.receipt.contractAddress, txOptions);

    // Verifying stored organization and token address.
    assert.strictEqual(mockToken, await contractInstance.methods.token().call(), 'Token address is incorrect');
    assert.strictEqual(
      organization,
      await contractInstance.methods.organization().call(),
      'Organization address is incorrect'
    );
  });

  it('Should deploy Gnosis MultiSig MasterCopy contract', async function() {
    this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const multiSigTxResponse = await userSetup.deployMultiSigMasterCopy(txOptions);
    gnosisSafeMasterCopyAddress = multiSigTxResponse.receipt.contractAddress;
    assert.strictEqual(multiSigTxResponse.receipt.status, true);
  });

  it('Should deploy TokenHolder MasterCopy contract', async function() {
    this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const tokenHolderTxResponse = await userSetup.deployTokenHolderMasterCopy(txOptions);
    thMasterCopyAddress = tokenHolderTxResponse.receipt.contractAddress;
    assert.strictEqual(tokenHolderTxResponse.receipt.status, true);
  });

  it('Should deploy UserWalletFactory contract', async function() {
    this.timeout(60000);

    const userSetup = new UserSetup(auxiliaryWeb3);
    const userWalletFactoryResponse = await userSetup.deployUserWalletFactory(txOptions);
    userWalletFactoryAddress = userWalletFactoryResponse.receipt.contractAddress;
    assert.strictEqual(userWalletFactoryResponse.receipt.status, true);
  });

  it('Should create a user wallet', async function() {
    this.timeout(3 * 60000);

    const userInstance = new User(
      gnosisSafeMasterCopyAddress,
      thMasterCopyAddress,
      mockToken,
      tokenRulesAddress,
      userWalletFactoryAddress,
      auxiliaryWeb3
    );

    const ZERO_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000',
      NULL_ADDRESS = '0x0000000000000000000000000000000000000000',
      owners = [wallets[3].address],
      threshold = 1,
      sessionKeys = [wallets[5].address],
      sessionKeysSpendingLimits = [1000000],
      sessionKeysExpirationHeights = [100000000000];

    const response = await userInstance.createUserWallet(
      owners,
      threshold,
      NULL_ADDRESS,
      ZERO_BYTES,
      sessionKeys,
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights,
      NULL_ADDRESS,
      NULL_ADDRESS,
      0,
      txOptions
    );

    assert.strictEqual(response.status, true, 'User wallet creation failed.');
  });
});
