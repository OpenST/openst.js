const Web3 = require('web3');
const Mosaic = require('@openstfoundation/mosaic.js');
const { assert } = require('chai');
const Package = require('../../index');

const MockContractsDeployer = require('./../utils/MockContractsDeployer');
const config = require('../utils/configReader');
const { dockerSetup, dockerTeardown } = require('./../../utils/docker');

const { Contracts } = Package;
const { Organization } = Package.ContractInteract;
const UserSetup = Package.Setup.User;
const UserHelper = Package.Helpers.User;

let txOptions,
  userWalletFactoryAddress,
  thMasterCopyAddress,
  gnosisSafeMasterCopyAddress,
  proxyFactoryAddress,
  tokenRulesAddress,
  delayedRecoveryModuleMasterCopyAddress,
  createAndAddModulesAddress,
  organizationAddress,
  eip20Token,
  tokenHolderSender,
  tokenHolderSecondReceiver,
  ephemeralKey,
  mockTokenDeployerInstance,
  deployerAddress,
  auxiliaryWeb3,
  accountsOrigin;

describe('Direct transfers between TH contracts', async function() {
  before(async function() {
    const { rpcEndpointOrigin } = await dockerSetup();
    auxiliaryWeb3 = new Web3(rpcEndpointOrigin);
    accountsOrigin = await auxiliaryWeb3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    txOptions = {
      from: deployerAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
    await auxiliaryWeb3.eth.accounts.wallet.create(10);
  });

  after(() => {
    dockerTeardown();
  });

  it('Deploys Organization contract', async function() {
    const orgConfig = {
      deployer: deployerAddress,
      owner: deployerAddress,
      admin: accountsOrigin[1],
      workers: [accountsOrigin[1]],
      workerExpirationHeight: config.workerExpirationHeight
    };
    const organizationContractInstance = await Organization.setup(auxiliaryWeb3, orgConfig, txOptions);
    organizationAddress = organizationContractInstance.address;
    assert.isNotNull(organizationAddress, 'Organization contract address should not be null.');
  });

  it('Deploys EIP20Token contract', async function() {
    mockTokenDeployerInstance = new MockContractsDeployer(deployerAddress, auxiliaryWeb3);

    await mockTokenDeployerInstance.deployMockToken();

    eip20Token = mockTokenDeployerInstance.addresses.MockToken;
    assert.isNotNull(eip20Token, 'EIP20Token contract address should not be null.');
  });

  it('Performs Setup of TokenHolder, MultiSig, DelayedRecoveryModule master copies', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const tokenHolderTxResponse = await userSetup.deployTokenHolderMasterCopy(txOptions);
    thMasterCopyAddress = tokenHolderTxResponse.receipt.contractAddress;
    assert.isNotNull(thMasterCopyAddress, 'TH master copy contract address should not be null.');

    const multiSigTxResponse = await userSetup.deployMultiSigMasterCopy(txOptions);
    gnosisSafeMasterCopyAddress = multiSigTxResponse.receipt.contractAddress;
    assert.isNotNull(gnosisSafeMasterCopyAddress, 'gnosis safe master copy contract address should not be null.');

    const txResponse = await userSetup.deployDelayedRecoveryModuleMasterCopy(txOptions);
    delayedRecoveryModuleMasterCopyAddress = txResponse.receipt.contractAddress;
    assert.isNotNull(
      delayedRecoveryModuleMasterCopyAddress,
      "DelayedRecoveryModule master copy contract's address is null."
    );
  });

  it('Performs setup of CreateAndAddModules, UserWalletFactory, ProxyFactory contracts', async function() {
    const userSetup = new UserSetup(auxiliaryWeb3);
    const txResponse = await userSetup.deployCreateAndAddModules(txOptions);
    createAndAddModulesAddress = txResponse.receipt.contractAddress;
    assert.isNotNull(createAndAddModulesAddress, "createAndAddModules contract's address is null.");

    const userWalletFactoryResponse = await userSetup.deployUserWalletFactory(txOptions);
    userWalletFactoryAddress = userWalletFactoryResponse.receipt.contractAddress;
    assert.isNotNull(userWalletFactoryAddress, 'UserWalletFactory contract address should not be null.');

    const proxyFactoryResponse = await userSetup.deployProxyFactory(txOptions);
    proxyFactoryAddress = proxyFactoryResponse.receipt.contractAddress;
    assert.isNotNull(proxyFactoryAddress, 'Proxy contract address should not be null.');
  });

  it('Deploys TokenRules contract', async function() {
    txOptions = {
      from: deployerAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };

    const tokenRulesSetupInstance = new Package.Setup.TokenRules(auxiliaryWeb3);

    const response = await tokenRulesSetupInstance.deploy(organizationAddress, eip20Token, txOptions);
    tokenRulesAddress = response.receipt.contractAddress;
    assert.isNotNull(tokenRulesAddress, 'tokenRules contract address should not be null.');

    const tokenRulesContractInstance = Contracts.getTokenRules(auxiliaryWeb3, tokenRulesAddress, txOptions);

    // Verifying stored organization and token address.
    assert.strictEqual(
      eip20Token,
      await tokenRulesContractInstance.methods.token().call(),
      'Token address is incorrect'
    );
    assert.strictEqual(
      organizationAddress,
      await tokenRulesContractInstance.methods.organization().call(),
      'Organization address is incorrect'
    );
  });

  it('Creates sender user wallet', async function() {
    txOptions.from = deployerAddress;
    const userInstance = new UserHelper(
      thMasterCopyAddress,
      gnosisSafeMasterCopyAddress,
      delayedRecoveryModuleMasterCopyAddress,
      createAndAddModulesAddress,
      eip20Token,
      tokenRulesAddress,
      userWalletFactoryAddress,
      proxyFactoryAddress,
      auxiliaryWeb3
    );

    await auxiliaryWeb3.eth.accounts.wallet.create(10);
    ephemeralKey = auxiliaryWeb3.eth.accounts.wallet[0];

    const owners = [accountsOrigin[2]],
      threshold = 1,
      sessionKeys = [ephemeralKey.address];

    const recoveryOwnerAddress = auxiliaryWeb3.eth.accounts.wallet[7].address;
    const recoveryControllerAddress = auxiliaryWeb3.eth.accounts.wallet[8].address;
    const recoveryBlockDelay = 10;

    const response = await userInstance.createUserWallet(
      owners,
      threshold,
      recoveryOwnerAddress,
      recoveryControllerAddress,
      recoveryBlockDelay,
      sessionKeys,
      [config.sessionKeySpendingLimit],
      [config.sessionKeyExpirationHeight],
      txOptions
    );

    // Fetching the gnosisSafe and tokenholder proxy address for the user.
    let returnValues = response.events.UserWalletCreated.returnValues;
    let userWalletEvent = JSON.parse(JSON.stringify(returnValues));

    tokenHolderSender = userWalletEvent._tokenHolderProxy;
  });

  it('Creates company wallet as second receiver', async function() {
    const userInstance = new UserHelper(
      thMasterCopyAddress,
      null, // gnosis safe master copy address
      null, // delayed recovery module master copy address
      null, // create and add modules contract address
      eip20Token,
      tokenRulesAddress,
      userWalletFactoryAddress,
      proxyFactoryAddress, // proxy factory address
      auxiliaryWeb3
    );

    await auxiliaryWeb3.eth.accounts.wallet.create(1);
    const sessionKey = auxiliaryWeb3.eth.accounts.wallet[0].address;

    const sessionKeys = [sessionKey];

    const response = await userInstance.createCompanyWallet(
      thMasterCopyAddress,
      sessionKeys,
      [config.sessionKeySpendingLimit],
      [config.sessionKeyExpirationHeight],
      txOptions
    );

    // Fetching the company tokenholder proxy address for the user.
    const returnValues = response.events.ProxyCreated.returnValues;
    const proxyEvent = JSON.parse(JSON.stringify(returnValues));

    tokenHolderSecondReceiver = proxyEvent._proxy;
    assert.isNotNull(tokenHolderSecondReceiver, 'Company TH contract address should not be null.');
  });

  it('Performs direct transfer of tokens', async function() {
    const tokenHolder = new Package.Helpers.TokenHolder(auxiliaryWeb3, tokenHolderSender);
    // MockToken instance is needed because for transfer. Transfer is not available in Mosaic.ContractInteract.EIP20Token
    // Please update after transfer is exposed in Mosaic.js
    const mockTokenAbi = mockTokenDeployerInstance.abiBinProvider.getABI('MockToken');
    const mockContractInstance = new auxiliaryWeb3.eth.Contract(mockTokenAbi, eip20Token, txOptions);

    const eip20Instance = new Mosaic.ContractInteract.EIP20Token(auxiliaryWeb3, eip20Token);

    // Funding TH proxy with tokens.
    const amount = config.senderTokenHolderBalance;
    const txObject = mockContractInstance.methods.transfer(tokenHolderSender, amount);
    await txObject.send(txOptions);

    const initialTHProxyBalance = await eip20Instance.balanceOf(tokenHolderSender);
    const firstReceiver = auxiliaryWeb3.eth.accounts.wallet[0].address;
    const transferTos = [firstReceiver, tokenHolderSecondReceiver];
    const firstReceiverInitialBalance = await eip20Instance.balanceOf(firstReceiver);
    const secondReceiverInitialBalance = await eip20Instance.balanceOf(tokenHolderSecondReceiver);
    const transferAmounts = [20, 10];

    const tokenRulesHelperObject = new Package.Helpers.TokenRules(tokenRulesAddress, auxiliaryWeb3);
    const directTransferExecutable = tokenRulesHelperObject.getDirectTransferExecutableData(
      transferTos,
      transferAmounts
    );
    const nonce = 0;

    let transaction = {
      from: tokenHolderSender,
      to: tokenRulesAddress,
      data: directTransferExecutable,
      nonce: nonce,
      callPrefix: await tokenHolder.getTokenHolderExecuteRuleCallPrefix(),
      value: 0,
      gasPrice: 0,
      gas: 0
    };

    const vrs = ephemeralKey.signEIP1077Transaction(transaction);

    await tokenHolder.executeRule(tokenRulesAddress, directTransferExecutable, nonce, vrs.r, vrs.s, vrs.v, txOptions);

    const finalTHSenderBalance = await eip20Instance.balanceOf(tokenHolderSender),
      firstReceiverFinalBalance = await eip20Instance.balanceOf(firstReceiver),
      secondReceiverFinalBalance = await eip20Instance.balanceOf(tokenHolderSecondReceiver),
      firstReceiverExpectedBalance = parseInt(firstReceiverInitialBalance) + transferAmounts[0],
      secondReceiverExpectedBalance = parseInt(secondReceiverInitialBalance) + transferAmounts[1];

    assert.strictEqual(
      initialTHProxyBalance - transferAmounts[0] - transferAmounts[1],
      parseInt(finalTHSenderBalance),
      `TokenHolder sender balance is ${finalTHSenderBalance} and expected balance is ${initialTHProxyBalance -
        transferAmounts[0] -
        transferAmounts[1]}`
    );

    assert.strictEqual(
      parseInt(firstReceiverFinalBalance),
      firstReceiverExpectedBalance,
      `First receiver account token balance is ${firstReceiverFinalBalance} and expected balance is ${firstReceiverExpectedBalance}`
    );

    assert.strictEqual(
      parseInt(secondReceiverFinalBalance),
      secondReceiverExpectedBalance,
      `Second receiver account token balance is ${secondReceiverFinalBalance} and expected balance is ${secondReceiverExpectedBalance}`
    );
  });
});
