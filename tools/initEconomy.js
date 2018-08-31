'use strict';

const fs = require('fs'),
  Web3 = require('web3'),
  shell = require('shelljs');

const passphrase = 'testtest';

const InitEconomy = function(params) {
  const oThis = this;

  oThis.setupRoot = params.setupRoot;

  oThis.configJsonFilePath = oThis.setupRoot + '/' + 'config.json';
};

InitEconomy.prototype = {
  perform: async function() {
    const oThis = this;

    // deploy the ERC20 contract
    await oThis._deployERC20Token();

    // deploy the TokenRule contract
    await oThis._deployTokenRules();

    // deploy and setup TokenHolder first contract
    await oThis._setupTokenHolder1();

    // deploy the TokenHolder contract
    // Add two wallets as owners
    // Do authorize session for adding an ephemeral key
    // await oThis._setupTokenHolder2();

    // deploy Rule and register rule to TokenRule
    // await oThis._registerRule();

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

    return contractDeploymentResponse;
  },

   // deploy the TokenHolder contract
   // Add two wallets as owners
   // Do authorize session for adding an ephemeral key
   // Fund ERC20 tokens
  _setupTokenHolder1: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let web3Provider = new Web3(configFileContent.gethRpcEndPoint),
      deployerAddress = configFileContent.deployerAddress,
      gasPrice = configFileContent.gasPrice,
      gasLimit = configFileContent.gasLimit;

    let InitTokenHolder = require('../lib/setup/InitTokenHolder');
    let TokenHolder = require('../lib/contract_interacts/TokenHolder');

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

    let spendingLimit = '10000000000000000000000000000'
        , expirationHeight = '10000000000000000000000000000';

    await web3Provider.eth.personal.unlockAccount(configFileContent.wallet1, passphrase);

    // Authorize an ephemeral public key
      contractDeploymentResponse.instance.methods.authorizeSession(
          configFileContent.ephemeralKey1,
          spendingLimit,
          expirationHeight
      ).send({
          from: configFileContent.wallet1,
          gasPrice: configFileContent.gasPrice
      });

    return contractDeploymentResponse;
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
