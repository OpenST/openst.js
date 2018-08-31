'use strict';

const fs = require('fs'),
  Web3 = require('web3'),
  shell = require('shelljs');

const passphrase = 'testtest';

const InitEconomy = function(params) {
  const oThis = this;

  oThis.setupRoot = params.setupRoot;

  oThis.configJsonFilePath = oThis.setupRoot + '/' + 'config.json';

  oThis.tokenRulesContractInstance = null;
};

InitEconomy.prototype = {
  perform: async function() {
    const oThis = this;

    // deploy the ERC20 contract
    await oThis._deployERC20Token();

    // deploy the TokenRule contract
    await oThis._deployTokenRules();

    // deploy and setup TokenHolder first user contract
    await oThis._setupTokenHolder1();

    // deploy and setup TokenHolder second user contract
    await oThis._setupTokenHolder2();

    // deploy Rule and register rule to TokenRule
   await oThis._registerRule();

    // Execute Rule
    // await oThis._executeRule();

    console.log('Economy init DONE!');
  },

  _deployERC20Token: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let web3Provider = new Web3(configFileContent.gethRpcEndPoint),
      deployerAddress = configFileContent.deployerAddress,
      gasPrice = configFileContent.gasPrice,
      gasLimit = configFileContent.gasLimit;

    let InitERC20Token = require('../lib/setup/InitERC20Token');

    console.log('* Deploying ERC20 Token');

    let contractDeploymentResponse = await new InitERC20Token({
      web3Provider: web3Provider,
      deployerAddress: deployerAddress,
      deployerPassphrase: passphrase,
      gasPrice: gasPrice,
      gasLimit: gasLimit
    }).perform();

    let erc20TokenContractAddress = contractDeploymentResponse.receipt.contractAddress;
    oThis._addConfig({
      erc20TokenContractAddress: erc20TokenContractAddress
    });

    return contractDeploymentResponse;
  },

  _deployTokenRules: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let web3Provider = new Web3(configFileContent.gethRpcEndPoint),
      deployerAddress = configFileContent.deployerAddress,
      gasPrice = configFileContent.gasPrice,
      gasLimit = configFileContent.gasLimit;

    let InitTokenRules = require('../lib/setup/InitTokenRules');

    console.log('* Deploying Token Rules Contract');

    let contractDeploymentResponse = await new InitTokenRules({
      web3Provider: web3Provider,
      deployerAddress: deployerAddress,
      deployerPassphrase: passphrase,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      args: [configFileContent.organizationAddress, configFileContent.erc20TokenContractAddress]
    }).perform();

    let tokenRulesContractAddress = contractDeploymentResponse.receipt.contractAddress;
    oThis._addConfig({
      tokenRulesContractAddress: tokenRulesContractAddress
    });

    oThis.tokenRulesContractInstance = contractDeploymentResponse.instance;

    return contractDeploymentResponse;
  },

  // deploy the TokenHolder contract
  // Add two wallets as owners
  // Do authorize session for adding an ephemeral key1
  // Fund ERC20 tokens
  _setupTokenHolder1: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let web3Provider = new Web3(configFileContent.gethRpcEndPoint),
      deployerAddress = configFileContent.deployerAddress,
      gasPrice = configFileContent.gasPrice,
      gasLimit = configFileContent.gasLimit;

    let InitTokenHolder = require('../lib/setup/InitTokenHolder');

    console.log('* Deploying Token Holder Contract1');

    let requirement = 2,
      wallets = [configFileContent.wallet1, configFileContent.wallet2];

    let contractDeploymentResponse = await new InitTokenHolder({
      web3Provider: web3Provider,
      deployerAddress: deployerAddress,
      deployerPassphrase: passphrase,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      args: [
        configFileContent.erc20TokenContractAddress,
        configFileContent.erc20TokenContractAddress,
        configFileContent.tokenRulesContractAddress,
        requirement,
        wallets
      ]
    }).perform();

    let tokenHolderContractAddress = contractDeploymentResponse.receipt.contractAddress;
    oThis._addConfig({
      tokenHolderContractAddress1: tokenHolderContractAddress
    });

    let spendingLimit = '10000000000000000000000000000',
      expirationHeight = '10000000000000000000000000000';

    await web3Provider.eth.personal.unlockAccount(configFileContent.wallet1, passphrase);

    // Authorize an ephemeral public key
    let authorizeSession1Response = await contractDeploymentResponse.instance.methods
      .authorizeSession(configFileContent.ephemeralKey1, spendingLimit, expirationHeight)
      .send({
        from: configFileContent.wallet1,
        gasPrice: configFileContent.gasPrice
      });

    console.log('authorizeSession1Response', JSON.stringify(authorizeSession1Response, null));

    await web3Provider.eth.personal.unlockAccount(configFileContent.wallet2, passphrase);

    // Authorize an ephemeral public key
    let authorizeSession2Response = await contractDeploymentResponse.instance.methods
      .authorizeSession(configFileContent.ephemeralKey1, spendingLimit, expirationHeight)
      .send({
        from: configFileContent.wallet2,
        gasPrice: configFileContent.gasPrice
      });

    console.log('authorizeSession2Response', JSON.stringify(authorizeSession2Response, null));

    let isAuthorizedEphemeralKeyResponse = await contractDeploymentResponse.instance.methods
      .isAuthorizedEphemeralKey(configFileContent.ephemeralKey1)
      .call({});

    if (isAuthorizedEphemeralKeyResponse !== true) {
      console.log('isAuthorizedEphemeralKeyResponse return false for key:', configFileContent.ephemeralKey1);
      shell.exit(1);
    }

    return contractDeploymentResponse;
  },

  // deploy the TokenHolder contract
  // Add two wallets as owners
  // Do authorize session for adding an ephemeral key2
  _setupTokenHolder2: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let web3Provider = new Web3(configFileContent.gethRpcEndPoint),
      deployerAddress = configFileContent.deployerAddress,
      gasPrice = configFileContent.gasPrice,
      gasLimit = configFileContent.gasLimit;

    let InitTokenHolder = require('../lib/setup/InitTokenHolder');

    console.log('* Deploying Token Holder Contract2');

    let requirement = 2,
      wallets = [configFileContent.wallet1, configFileContent.wallet2];

    let contractDeploymentResponse = await new InitTokenHolder({
      web3Provider: web3Provider,
      deployerAddress: deployerAddress,
      deployerPassphrase: passphrase,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      args: [
        configFileContent.erc20TokenContractAddress,
        configFileContent.erc20TokenContractAddress,
        configFileContent.tokenRulesContractAddress,
        requirement,
        wallets
      ]
    }).perform();

    let tokenHolderContractAddress = contractDeploymentResponse.receipt.contractAddress;
    oThis._addConfig({
      tokenHolderContractAddress2: tokenHolderContractAddress
    });

    let spendingLimit = '10000000000000000000000000000',
      expirationHeight = '10000000000000000000000000000';

    await web3Provider.eth.personal.unlockAccount(configFileContent.wallet1, passphrase);

    // Authorize an ephemeral public key
    let authorizeSession1Response = await contractDeploymentResponse.instance.methods
      .authorizeSession(configFileContent.ephemeralKey2, spendingLimit, expirationHeight)
      .send({
        from: configFileContent.wallet1,
        gasPrice: configFileContent.gasPrice
      });

    console.log('authorizeSession1Response', JSON.stringify(authorizeSession1Response, null));

    await web3Provider.eth.personal.unlockAccount(configFileContent.wallet2, passphrase);

    // Authorize an ephemeral public key
    let authorizeSession2Response = await contractDeploymentResponse.instance.methods
      .authorizeSession(configFileContent.ephemeralKey2, spendingLimit, expirationHeight)
      .send({
        from: configFileContent.wallet2,
        gasPrice: configFileContent.gasPrice
      });

    console.log('authorizeSession2Response', JSON.stringify(authorizeSession2Response, null));

    let isAuthorizedEphemeralKeyResponse = await contractDeploymentResponse.instance.methods
      .isAuthorizedEphemeralKey(configFileContent.ephemeralKey2)
      .call({});

    if (isAuthorizedEphemeralKeyResponse !== true) {
      console.log('isAuthorizedEphemeralKeyResponse return false for key:', configFileContent.ephemeralKey1);
      shell.exit(1);
    }

    return contractDeploymentResponse;
  },

  // deploys TransferRule contract
  // Registers TransferRule to TokenRules
  _registerRule: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let web3Provider = new Web3(configFileContent.gethRpcEndPoint),
        deployerAddress = configFileContent.deployerAddress,
        gasPrice = configFileContent.gasPrice,
        gasLimit = configFileContent.gasLimit;

    let InitTransferRule = require('../lib/setup/InitTransferRule');

    console.log('* Deploying Transfer Rule Contract');

    let contractDeploymentResponse = await new InitTransferRule({
        web3Provider: web3Provider,
        deployerAddress: deployerAddress,
        deployerPassphrase: passphrase,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        args: [
          configFileContent.tokenRulesContractAddress
        ]
    }).perform();

    let transferRuleContractAddress = contractDeploymentResponse.receipt.contractAddress;
    oThis._addConfig({
      transferRuleContractAddress: transferRuleContractAddress
    });

    // Register Rule in TokenRules Contract
    let registerRuleResponse = await oThis.tokenRulesContractInstance.instance.methods
      .registerRule("TransferRule", configFileContent.tokenRulesContractAddress)
      .send({
        from: configFileContent.organizationAddress,
        gasPrice: configFileContent.gasPrice
      });

    return registerRuleResponse;
  },

  _fundEthFor: function(web3Provider, senderAddr, recipient, amount) {
    return web3Provider.eth.personal.unlockAccount(senderAddr, passphrase).then(function() {
      return web3Provider.eth.sendTransaction({
        from: senderAddr,
        to: recipient,
        value: amount,
        gasPrice: setUpConfig.chain.gasprice,
        gas: setUpConfig.chain.gasLimit
      });
    });
  },

  _addConfig: function(params) {
    const oThis = this;

    let fileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    for (var i in params) {
      fileContent[i] = params[i];
    }

    oThis._executeInShell("echo '" + JSON.stringify(fileContent) + "' > " + oThis.configJsonFilePath);
  },

  _executeInShell: function(cmd) {
    let res = shell.exec(cmd);

    if (res.code !== 0) {
      shell.exit(1);
    }

    return res;
  }
};

// commander
const os = require('os');
new InitEconomy({
  setupRoot: os.homedir() + '/openst-setup'
}).perform();
