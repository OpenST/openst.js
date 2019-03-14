const Web3 = require('web3');
const { assert } = require('chai');
const Package = require('../../index');
const abiDecoder = require('abi-decoder');

const MockContractsDeployer = require('../utils/MockContractsDeployer');
const config = require('../utils/configReader');
const { dockerSetup, dockerTeardown } = require('./../../utils/docker');

const UserSetup = Package.Setup.User;
const { Contracts } = Package;
const { Organization } = Package.ContractInteract;
const TokenHolderHelper = Package.Helpers.TokenHolder;
const abiBinProvider = new Package.AbiBinProvider();

let auxiliaryWeb3,
  deployerAddress,
  userWalletFactoryAddress,
  thMasterCopyAddress,
  gnosisSafeMasterCopyAddress,
  tokenRulesAddress,
  delayedRecoveryModuleMasterCopyAddress,
  createAndAddModulesAddress,
  worker,
  eip20Token,
  tokenHolderProxy,
  gnosisSafeProxy,
  ephemeralKey,
  gnosisSafeProxyInstance,
  txOptions,
  tokenHolderHelperObject;

describe('Wallet operations', async function() {
  before(async function() {
    const { rpcEndpoint } = await dockerSetup();
    auxiliaryWeb3 = new Web3(rpcEndpoint);
    const accountsOrigin = await auxiliaryWeb3.eth.getAccounts();
    deployerAddress = accountsOrigin[0];
    worker = accountsOrigin[1];

    txOptions = {
      from: deployerAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };
  });

  after(() => {
    dockerTeardown();
  });

  it('Performs initial setup for economy', async function() {
    const orgConfig = {
      deployer: deployerAddress,
      owner: deployerAddress,
      admin: worker,
      workers: [worker],
      workerExpirationHeight: config.workerExpirationHeight
    };
    const organizationContractInstance = await Organization.setup(auxiliaryWeb3, orgConfig, txOptions);
    const organization = organizationContractInstance.address;
    assert.isNotNull(organization, 'Organization contract address should not be null.');

    const deployerInstance = new MockContractsDeployer(deployerAddress, auxiliaryWeb3);
    await deployerInstance.deployMockToken();

    eip20Token = deployerInstance.addresses.MockToken;
    assert.isNotNull(eip20Token, 'EIP20Token contract address should not be null.');

    const tokenRules = new Package.Setup.TokenRules(auxiliaryWeb3);

    const response = await tokenRules.deploy(organization, eip20Token, txOptions, auxiliaryWeb3);
    tokenRulesAddress = response.receipt.contractAddress;

    const contractInstance = Contracts.getTokenRules(auxiliaryWeb3, response.receipt.contractAddress, txOptions);

    // Verifying stored organization and token address.
    assert.strictEqual(eip20Token, await contractInstance.methods.token().call(), 'Token address is incorrect');
    assert.strictEqual(
      organization,
      await contractInstance.methods.organization().call(),
      'Organization address is incorrect'
    );
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

  // wallet3, wallet9 are the owners.
  it('Creates user wallet', async function() {
    await auxiliaryWeb3.eth.accounts.wallet.create(10);

    ephemeralKey = auxiliaryWeb3.eth.accounts.wallet[0];

    const userInstance = new Package.Helpers.User(
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

    const owners = [auxiliaryWeb3.eth.accounts.wallet[1].address, auxiliaryWeb3.eth.accounts.wallet[2].address],
      threshold = 1,
      sessionKeys = [ephemeralKey.address],
      sessionKeysSpendingLimits = [config.sessionKeySpendingLimit],
      sessionKeysExpirationHeights = [config.sessionKeyExpirationHeight];

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
      sessionKeysSpendingLimits,
      sessionKeysExpirationHeights,
      txOptions
    );

    assert.strictEqual(response.status, true, 'User wallet creation failed.');

    // Fetching the gnosisSafe and tokenholder proxy address for the user.
    let returnValues = response.events.UserWalletCreated.returnValues;
    let userWalletEvent = JSON.parse(JSON.stringify(returnValues));

    gnosisSafeProxy = userWalletEvent._gnosisSafeProxy;
    tokenHolderProxy = userWalletEvent._tokenHolderProxy;
  });

  // wallet1 and wallet2 are the owners.
  // // After AddWallet wallet1, wallet2, wallet3 are the owners.
  it('Owner adds a wallet', async function() {
    await auxiliaryWeb3.eth.accounts.wallet.create(1);

    gnosisSafeProxyInstance = new Package.Helpers.GnosisSafe(gnosisSafeProxy, auxiliaryWeb3);

    const ownerToAdd = auxiliaryWeb3.eth.accounts.wallet[3],
      currentOwner = auxiliaryWeb3.eth.accounts.wallet[1],
      threshold = 1,
      ownerToAddWithThresholdExData = gnosisSafeProxyInstance.getAddOwnerWithThresholdExecutableData(
        ownerToAdd.address,
        threshold
      );

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      gnosisSafeProxy,
      0,
      ownerToAddWithThresholdExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    // 2. Generate EIP712 Signature.
    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);

    const result = await gnosisSafeProxyInstance.execTransaction(
      gnosisSafeProxy,
      0,
      ownerToAddWithThresholdExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const returnValues = result.events.AddedOwner.returnValues;
    const addedOwnerEvent = JSON.parse(JSON.stringify(returnValues));

    // Verifying added owner.
    assert.strictEqual(addedOwnerEvent.owner, ownerToAdd.address, 'Incorrect owner added');
  });

  // wallet1, wallet2, wallet3 are the owners.
  // After ReplaceWallet wallet2, wallet3, wallet4 are the owners.
  it('Owner replaces a wallet', async function() {
    const owners = await gnosisSafeProxyInstance.getOwners();
    await auxiliaryWeb3.eth.accounts.wallet.create(1);
    const newOwner = auxiliaryWeb3.eth.accounts.wallet[4],
      currentOwner = auxiliaryWeb3.eth.accounts.wallet[1],
      previousOwner = gnosisSafeProxyInstance.findPreviousOwner(owners, currentOwner.address),
      swapOwnerExData = gnosisSafeProxyInstance.getSwapOwnerExecutableData(
        previousOwner, // previous owner.
        currentOwner.address, // owner to be replaced
        newOwner.address // new owner
      );

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      gnosisSafeProxy,
      0,
      swapOwnerExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    // 2. Generate EIP712 Signature.
    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      gnosisSafeProxy,
      0,
      swapOwnerExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const addedOwnerReturnValues = result.events.AddedOwner.returnValues;
    const addedOwnerEvent = JSON.parse(JSON.stringify(addedOwnerReturnValues));

    const removedOwnerReturnValues = result.events.RemovedOwner.returnValues;
    const removedOwnerEvent = JSON.parse(JSON.stringify(removedOwnerReturnValues));

    assert.strictEqual(addedOwnerEvent.owner, newOwner.address, 'Incorrect owner added');
    assert.strictEqual(removedOwnerEvent.owner, currentOwner.address, 'Incorrect owner removed');
  });

  // // wallet2, wallet3, wallet4 are the owners.
  // After RemoveWallet wallet2, wallet4 are the owners.
  it('Owner removes a wallet', async function() {
    const removeOwner = auxiliaryWeb3.eth.accounts.wallet[3],
      owner = auxiliaryWeb3.eth.accounts.wallet[2];

    const owners = await gnosisSafeProxyInstance.getOwners();
    const previousOwner = gnosisSafeProxyInstance.findPreviousOwner(owners, removeOwner.address);

    const removeOwnerExData = gnosisSafeProxyInstance.getRemoveOwnerExecutableData(
      previousOwner, // previous owner.
      removeOwner.address, // owner to be removed.
      1 // threshold
    );

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      gnosisSafeProxy,
      0,
      removeOwnerExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    // 2. Generate EIP712 Signature.
    const ownerSig1 = await owner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      gnosisSafeProxy,
      0,
      removeOwnerExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSig1.signature,
      txOptions
    );

    const removedOwnerReturnValues = result.events.RemovedOwner.returnValues;
    const removedOwnerEvent = JSON.parse(JSON.stringify(removedOwnerReturnValues));

    assert.strictEqual(removedOwnerEvent.owner, removeOwner.address, 'Incorrect removed owner address');
  });

  // wallet2, wallet4 are the owners.
  it('Owner authorizes a session', async function() {
    await auxiliaryWeb3.eth.accounts.wallet.create(1);
    tokenHolderHelperObject = new TokenHolderHelper(auxiliaryWeb3, tokenHolderProxy);
    const sessionKey = auxiliaryWeb3.eth.accounts.wallet[5].address;
    const spendingLimit = config.sessionKeySpendingLimit;
    const expirationHeight = config.sessionKeyExpirationHeight;
    const currentOwner = auxiliaryWeb3.eth.accounts.wallet[2];
    const authorizeSessionExData = tokenHolderHelperObject.getAuthorizeSessionExecutableData(
      sessionKey,
      spendingLimit,
      expirationHeight
    );

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      tokenHolderProxy,
      0,
      authorizeSessionExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      tokenHolderProxy,
      0,
      authorizeSessionExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const txReceipt = await auxiliaryWeb3.eth.getTransactionReceipt(result.transactionHash);

    abiDecoder.addABI(abiBinProvider.getABI('GnosisSafe'));
    abiDecoder.addABI(abiBinProvider.getABI('TokenHolder'));

    const decodedResult = abiDecoder.decodeLogs(txReceipt.logs);

    const sessionAuthorized = JSON.parse(JSON.stringify(decodedResult));

    assert.strictEqual(sessionAuthorized[0].name, 'SessionAuthorized', 'Event name not as expected ');
    assert.strictEqual(
      auxiliaryWeb3.utils.toChecksumAddress(sessionAuthorized[0].events[0].value),
      auxiliaryWeb3.utils.toChecksumAddress(sessionKey),
      'Session key is not authorized'
    );
  });

  // wallet2, wallet4 are the owners.
  it('Owner revokes a session', async function() {
    const sessionKey = auxiliaryWeb3.eth.accounts.wallet[5].address;
    const currentOwner = auxiliaryWeb3.eth.accounts.wallet[2];
    const revokeSessionExData = tokenHolderHelperObject.getRevokeSessionExecutableData(sessionKey);

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      tokenHolderProxy,
      0,
      revokeSessionExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      tokenHolderProxy,
      0,
      revokeSessionExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const txReceipt = await auxiliaryWeb3.eth.getTransactionReceipt(result.transactionHash);

    abiDecoder.addABI(abiBinProvider.getABI('GnosisSafe'));
    abiDecoder.addABI(abiBinProvider.getABI('TokenHolder'));

    const decodedResult = abiDecoder.decodeLogs(txReceipt.logs);

    const sessionRevoked = JSON.parse(JSON.stringify(decodedResult));

    assert.strictEqual(sessionRevoked[0].name, 'SessionRevoked', 'Event name not as expected ');
    assert.strictEqual(
      auxiliaryWeb3.utils.toChecksumAddress(sessionRevoked[0].events[0].value),
      auxiliaryWeb3.utils.toChecksumAddress(sessionKey),
      'Session key revoked is incorrect'
    );
  });

  // wallet2, wallet4 are the owners.
  it('Owner logs out all sessions', async function() {
    const tokenHolderInstance = new TokenHolderHelper(auxiliaryWeb3, tokenHolderProxy);
    const currentOwner = auxiliaryWeb3.eth.accounts.wallet[2];
    const logoutExData = tokenHolderInstance.getLogoutExecutableData();

    const nonce = await gnosisSafeProxyInstance.getNonce();

    const safeTxData = await gnosisSafeProxyInstance.getSafeTxData(
      tokenHolderProxy,
      0,
      logoutExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      tokenHolderProxy,
      0,
      logoutExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const txReceipt = await auxiliaryWeb3.eth.getTransactionReceipt(result.transactionHash);

    abiDecoder.addABI(abiBinProvider.getABI('GnosisSafe'));
    abiDecoder.addABI(abiBinProvider.getABI('TokenHolder'));

    const decodedResult = abiDecoder.decodeLogs(txReceipt.logs);

    const sessionsLoggedOutEvent = JSON.parse(JSON.stringify(decodedResult));

    assert.strictEqual(sessionsLoggedOutEvent[0].name, 'SessionsLoggedOut', 'Incorrect event emitted');
    assert.strictEqual(sessionsLoggedOutEvent[0].events[0].value, '2', 'Incorrect sessionwindow value');
  });

  // wallet2, wallet4 are the owners.
  it('Owner changes required threshold', async function() {
    // Owners already added should be equal or less than the threshold limit.
    const newThreshold = 2;
    const currentOwner = auxiliaryWeb3.eth.accounts.wallet[2];
    const changeThresholdExecutableData = gnosisSafeProxyInstance.getChangeThresholdExecutableData(newThreshold);

    const nonce = await gnosisSafeProxyInstance.getNonce();
    const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
      gnosisSafeProxy,
      0,
      changeThresholdExecutableData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      nonce
    );

    const ownerSignature = await currentOwner.signEIP712TypedData(safeTxData);
    const result = await gnosisSafeProxyInstance.execTransaction(
      gnosisSafeProxy,
      0,
      changeThresholdExecutableData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      ownerSignature.signature,
      txOptions
    );

    const changeThresholdReturnValues = result.events.ChangedThreshold.returnValues;
    const changeThresholdEvent = JSON.parse(JSON.stringify(changeThresholdReturnValues));

    assert.strictEqual(
      changeThresholdEvent.threshold.toString(),
      newThreshold.toString(),
      'Expected threshold was not set'
    );
  });
});
