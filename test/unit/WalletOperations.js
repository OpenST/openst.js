// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index'),
  Account = require('eth-lib/lib/account'),
  abiDecoder = require('abi-decoder');

const TokenRulesSetup = Package.Setup.TokenRules,
  UserSetup = Package.Setup.User,
  MockContractsDeployer = require('./../utils/MockContractsDeployer'),
  Mosaic = require('@openstfoundation/mosaic-tbd'),
  config = require('../utils/configReader'),
  Web3WalletHelper = require('../utils/Web3WalletHelper'),
  Contracts = Package.Contracts,
  User = Package.Helpers.User,
  AbiBinProvider = Package.AbiBinProvider,
  TokenRules = Package.Helpers.TokenRules,
  TokenHolder = Package.Helpers.TokenHolder,
  GnosisSafe = Package.Helpers.GnosisSafe;

const auxiliaryWeb3 = new Web3(config.gethRpcEndPoint),
  web3WalletHelper = new Web3WalletHelper(auxiliaryWeb3),
  assert = chai.assert,
  OrganizationHelper = Mosaic.ChainSetup.OrganizationHelper,
  abiBinProvider = new AbiBinProvider();

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
  mockToken,
  owner = config.deployerAddress,
  tokenHolderProxy,
  gnosisSafeProxy,
  ephemeralKey,
  deployerInstance,
  tokenRules,
  gnosisSafeProxyInstance;

describe('Wallet operations', async function() {
  before(async function() {
    await web3WalletHelper.init(auxiliaryWeb3);
    wallets = web3WalletHelper.web3Object.eth.accounts.wallet;
    worker = wallets[1].address;
    beneficiary = wallets[2].address;
    facilitator = wallets[3].address;
  });

  it('Should deploy Organization contract', async function() {
    let orgHelper = new OrganizationHelper(auxiliaryWeb3, null);
    const orgConfig = {
      deployer: config.deployerAddress,
      owner: owner,
      workers: worker,
      workerExpirationHeight: '20000000'
    };

    await orgHelper.setup(orgConfig);
    organization = orgHelper.address;

    assert.isNotNull(organization, 'Organization contract address should not be null.');
  });

  it('Deploys EIP20Token contract', async function() {
    deployerInstance = new MockContractsDeployer(config.deployerAddress, auxiliaryWeb3);

    await deployerInstance.deployMockToken();

    mockToken = deployerInstance.addresses.MockToken;
    assert.isNotNull(mockToken, 'EIP20Token contract address should not be null.');
  });

  it('Should deploy TokenRules contract', async function() {
    this.timeout(3 * 60000);

    tokenRules = new TokenRulesSetup(auxiliaryWeb3);

    const response = await tokenRules.deploy(organization, mockToken, txOptions, auxiliaryWeb3);
    tokenRulesAddress = response.receipt.contractAddress;
    const openstContracts = new Contracts(auxiliaryWeb3);

    let contractInstance = openstContracts.TokenRules(response.receipt.contractAddress, txOptions);

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

    ephemeralKey = wallets[5];
    const owners = [wallets[3].address],
      threshold = 1,
      sessionKeys = [ephemeralKey.address],
      sessionKeysSpendingLimits = [config.sessionKeySpendingLimit],
      sessionKeysExpirationHeights = [config.sessionKeyExpirationHeight];

    const response = await userInstance.createUserWallet(
      [owners[0]],
      threshold,
      config.NULL_ADDRESS,
      config.ZERO_BYTES,
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

  it('Should add wallet', async function() {
    gnosisSafeProxyInstance = new GnosisSafe(gnosisSafeProxy, auxiliaryWeb3);

    const ownerToAdd = wallets[7],
      owner = wallets[3],
      threshold = 2,
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
    const ownerSignature = await owner.signEIP712TypedData(safeTxData);

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
    // -----------
    const thirdOwner = wallets[9].address;
    const secondAddOwnerWithThresholdExData = gnosisSafeProxyInstance.getAddOwnerWithThresholdExecutableData(
      thirdOwner,
      threshold
    );

    const safeTxData2 = gnosisSafeProxyInstance.getSafeTxData(
      gnosisSafeProxy,
      0,
      secondAddOwnerWithThresholdExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      await gnosisSafeProxyInstance.getNonce()
    );

    const ownerSig1 = await owner.signEIP712TypedData(safeTxData2);
    const ownerSig2 = await ownerToAdd.signEIP712TypedData(safeTxData2);

    const receipt = await gnosisSafeProxyInstance.execTransaction(
      gnosisSafeProxy,
      0,
      secondAddOwnerWithThresholdExData,
      0,
      0,
      0,
      0,
      config.NULL_ADDRESS,
      config.NULL_ADDRESS,
      // TODO Abhay Do we need method for below
      ownerSig1.signature + ownerSig2.signature.substring(2, ownerSig2.length),
      txOptions
    );

    const addOwnerReturnValues = receipt.events.AddedOwner.returnValues;
    const addedOwner = JSON.parse(JSON.stringify(addOwnerReturnValues));

    // Verifying added owner.
    assert.strictEqual(addedOwner.owner, thirdOwner, 'Incorrect owner added');
  });

  // it('Should remove wallet', async function() {
  //
  //   gnosisSafeProxyInstance = new GnosisSafe(gnosisSafeProxy, auxiliaryWeb3);
  //
  //   const removeOwner = wallets[9],
  //     prevOwner = wallets[7];
  //   const owners = await gnosisSafeProxyInstance.getOwners();
  //   const previousOwner = gnosisSafeProxyInstance.findPreviousOwner(owners, removeOwner.address);
  //
  //   const removeOwnerExData = gnosisSafeProxyInstance.getRemoveOwnerExecutableData(
  //       previousOwner, // previous owner.
  //       removeOwner.address, // owner to be removed.
  //       1 // threshold
  //     );
  //
  //   const nonce = await gnosisSafeProxyInstance.getNonce();
  //   const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
  //     gnosisSafeProxy,
  //     0,
  //     removeOwnerExData,
  //     0,
  //     0,
  //     0,
  //     0,
  //     config.NULL_ADDRESS,
  //     config.NULL_ADDRESS,
  //     nonce
  //   );
  //
  //   // 2. Generate EIP712 Signature.
  //   const ownerSignature = await prevOwner.signEIP712TypedData(safeTxData);
  //   const result = await gnosisSafeProxyInstance.execTransaction(
  //     gnosisSafeProxy,
  //     0,
  //     removeOwnerExData,
  //     0,
  //     0,
  //     0,
  //     0,
  //     config.NULL_ADDRESS,
  //     config.NULL_ADDRESS,
  //     ownerSignature.signature,
  //     txOptions
  //   );
  //
  //   const removedOwnerReturnValues = result.events.RemovedOwner.returnValues;
  //   const removedOwnerEvent = JSON.parse(JSON.stringify(removedOwnerReturnValues));
  //
  //   assert.strictEqual(removedOwnerEvent.owner, removeOwner.address, "Incorrect removed owner address");
  //
  // });

  // it('Should replace wallet', async function() {
  //
  //   gnosisSafeProxyInstance = new GnosisSafe(gnosisSafeProxy, auxiliaryWeb3);
  //   const owners = await gnosisSafeProxyInstance.getOwners();
  //
  //   const newOwner = wallets[8],
  //     owner = wallets[3],
  //     previousOwner = gnosisSafeProxyInstance.findPreviousOwner(owners, owner.address),
  //     swapOwnerExData = gnosisSafeProxyInstance.getSwapOwnerExecutableData(
  //       previousOwner, // previous owner.
  //       owner.address, // owner to be replaceed
  //       newOwner.address // new owner
  //     );
  //
  //   const nonce = await gnosisSafeProxyInstance.getNonce();
  //   const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
  //     gnosisSafeProxy,
  //     0,
  //     swapOwnerExData,
  //     0,
  //     0,
  //     0,
  //     0,
  //     config.NULL_ADDRESS,
  //     config.NULL_ADDRESS,
  //     nonce
  //   );
  //
  //   // 2. Generate EIP712 Signature.
  //   const ownerSignature = await owner.signEIP712TypedData(safeTxData);
  //   const result = await gnosisSafeProxyInstance.execTransaction(
  //     gnosisSafeProxy,
  //     0,
  //     swapOwnerExData,
  //     0,
  //     0,
  //     0,
  //     0,
  //     config.NULL_ADDRESS,
  //     config.NULL_ADDRESS,
  //     ownerSignature.signature,
  //     txOptions
  //   );
  //
  //   const addedOwnerReturnValues = result.events.AddedOwner.returnValues;
  //   const addedOwnerEvent = JSON.parse(JSON.stringify(addedOwnerReturnValues));
  //
  //   const removedOwnerReturnValues = result.events.RemovedOwner.returnValues;
  //   const removedOwnerEvent = JSON.parse(JSON.stringify(removedOwnerReturnValues));
  //
  //   assert.strictEqual(addedOwnerEvent.owner, newOwner.address, "Incorrect owner added");
  //   assert.strictEqual(removedOwnerEvent.owner, owner.address, "Incorrect owner removed");
  //
  // });

  // it('Should authorize session',async function () {
  //
  //   const tokenHolderInstance = new TokenHolder(auxiliaryWeb3, tokenRulesAddress, tokenHolderProxy);
  //   const sessionKey = wallets[8].address;
  //   const spendingLimit = config.sessionKeySpendingLimit;
  //   const expirationHeight = config.sessionKeyExpirationHeight;
  //   const prevOwner = wallets[7];
  //   const authorizeSessionExData = tokenHolderInstance.getAuthorizeSessionExecutableData(sessionKey, spendingLimit, expirationHeight);
  //
  //   const nonce = await gnosisSafeProxyInstance.getNonce();
  //   const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
  //     tokenHolderProxy,
  //     0,
  //     authorizeSessionExData,
  //     0,
  //     0,
  //     0,
  //     0,
  //     config.NULL_ADDRESS,
  //     config.NULL_ADDRESS,
  //     nonce
  //   );
  //
  //   const ownerSignature = await prevOwner.signEIP712TypedData(safeTxData);
  //   const result = await gnosisSafeProxyInstance.execTransaction(
  //     tokenHolderProxy,
  //     0,
  //     authorizeSessionExData,
  //     0,
  //     0,
  //     0,
  //     0,
  //     config.NULL_ADDRESS,
  //     config.NULL_ADDRESS,
  //     ownerSignature.signature,
  //     txOptions
  //   );
  //   console.log("session keyssss :- ",sessionKey);
  //
  //   console.log("result :- ",JSON.stringify(result));
  //
  //   const txReceipt = await auxiliaryWeb3.eth.getTransactionReceipt(result.transactionHash);
  //
  //   abiDecoder.addABI(abiBinProvider.getABI('GnosisSafe'));
  //   abiDecoder.addABI(abiBinProvider.getABI('TokenHolder'));
  //
  //   const decodedResult = abiDecoder.decodeLogs(txReceipt.logs);
  //
  //   const sessionAuthorized = JSON.parse(JSON.stringify(decodedResult));
  //
  //   assert.strictEqual(sessionAuthorized[0].name, "SessionAuthorized", "Event name not as expected ");
  //   assert.strictEqual(
  //     auxiliaryWeb3.utils.toChecksumAddress(sessionAuthorized[0].events[0].value),
  //     auxiliaryWeb3.utils.toChecksumAddress(sessionKey),
  //     "Session key is not authorized"
  //   );
  //
  // });

  // it('Should revoke session',async function () {
  //
  //   const tokenHolderInstance = new TokenHolder(auxiliaryWeb3, tokenRulesAddress, tokenHolderProxy);
  //   const sessionKey = wallets[8].address;
  //   const prevOwner = wallets[7];
  //   const revokeSessionExData = tokenHolderInstance.getRevokeSessionExecutableData(sessionKey);
  //
  //   const nonce = await gnosisSafeProxyInstance.getNonce();
  //   const safeTxData = gnosisSafeProxyInstance.getSafeTxData(
  //     tokenHolderProxy,
  //     0,
  //     revokeSessionExData,
  //     0,
  //     0,
  //     0,
  //     0,
  //     config.NULL_ADDRESS,
  //     config.NULL_ADDRESS,
  //     nonce
  //   );
  //
  //   const ownerSignature = await prevOwner.signEIP712TypedData(safeTxData);
  //   const result = await gnosisSafeProxyInstance.execTransaction(tokenHolderProxy, 0, revokeSessionExData, 0, 0, 0, 0, config.NULL_ADDRESS, config.NULL_ADDRESS, ownerSignature.signature, txOptions);
  //
  //   const txReceipt = await auxiliaryWeb3.eth.getTransactionReceipt(result.transactionHash);
  //
  //   abiDecoder.addABI(abiBinProvider.getABI('GnosisSafe'));
  //   abiDecoder.addABI(abiBinProvider.getABI('TokenHolder'));
  //
  //   const decodedResult = abiDecoder.decodeLogs(txReceipt.logs);
  //
  //   // console.log("\ndecodedResult :- ", JSON.stringify(decodedResult));
  //   const sessionRevoked = JSON.parse(JSON.stringify(decodedResult));
  //
  //   assert.strictEqual(sessionRevoked[0].name, "SessionRevoked", "Event name not as expected ");
  //   assert.strictEqual(
  //     auxiliaryWeb3.utils.toChecksumAddress(sessionRevoked[0].events[0].value),
  //     auxiliaryWeb3.utils.toChecksumAddress(sessionKey),
  //     "Sessoin key revoked is incorrect"
  //   );
  //
  // });
});
