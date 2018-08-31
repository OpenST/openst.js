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

    // deploy the TokenHolder contract
    // await oThis._setupTokenHolder();

    // deploy Rule and register rule to TokenHolder
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

  _deployTokenHolder: async function() {
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
