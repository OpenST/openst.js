'use strict';

const fs = require('fs'),
  Web3 = require('web3'),
  shell = require('shelljs'),
  BigNumber = require('bignumber.js');

const passphrase = 'testtest';

const InitEconomy = function(params) {
  const oThis = this;

  oThis.setupRoot = params.setupRoot;

  oThis.configJsonFilePath = oThis.setupRoot + '/' + 'config.json';

  oThis.tokenRulesContractInstance = null;

  oThis.erc20ContractInstance = null;

  oThis.tokenHolderContractInstance1 = null;

  oThis.transferRuleContractInstance = null;
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

    await oThis._fundERC20ToToken();

    // deploy Rule and register rule to TokenRule
    await oThis._registerRule();

    // Execute Rule
    await oThis._executeRule();

    console.log('Yayy!!! Economy init DONE!');
  },

  _deployERC20Token: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let web3Provider = new Web3(configFileContent.gethRpcEndPoint),
      deployerAddress = configFileContent.deployerAddress,
      gasPrice = configFileContent.gasPrice,
      gasLimit = configFileContent.gasLimit;

    let OpenST = require('../index.js');
    let openST = new OpenST(web3Provider);

    let InitERC20Token = openST.setup.InitERC20Token;

    console.log('* Deploying ERC20 Token');

    let contractDeploymentResponse = await new InitERC20Token({
      deployerAddress: deployerAddress,
      deployerPassphrase: passphrase,
      gasPrice: gasPrice,
      gasLimit: gasLimit
    }).perform();

    if (contractDeploymentResponse.receipt.status != '0x1') {
      console.log('ERC20Token deployment failed');
      shell.exit(1);
    }
    let erc20TokenContractAddress = contractDeploymentResponse.receipt.contractAddress;
    oThis._addConfig({
      erc20TokenContractAddress: erc20TokenContractAddress
    });

    oThis.erc20ContractInstance = contractDeploymentResponse.instance;

    return contractDeploymentResponse;
  },

  _deployTokenRules: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let web3Provider = new Web3(configFileContent.gethRpcEndPoint),
      deployerAddress = configFileContent.deployerAddress,
      gasPrice = configFileContent.gasPrice,
      gasLimit = configFileContent.gasLimit;

    let OpenST = require('../index.js');
    let openST = new OpenST(web3Provider);

    let InitTokenRules = openST.setup.InitTokenRules;

    console.log('* Deploying Token Rules Contract');

    let contractDeploymentResponse = await new InitTokenRules({
      deployerAddress: deployerAddress,
      deployerPassphrase: passphrase,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      args: [configFileContent.organizationAddress, configFileContent.erc20TokenContractAddress]
    }).perform();

    if (contractDeploymentResponse.receipt.status != '0x1') {
      console.log('TokenRules deployment failed');
      shell.exit(1);
    }
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

    let OpenST = require('../index.js');
    let openST = new OpenST(web3Provider);

    let InitTokenHolder = openST.setup.InitTokenHolder;

    console.log('* Deploying Token Holder Contract1');

    let requirement = 2,
      wallets = [configFileContent.wallet1, configFileContent.wallet2];

    let contractDeploymentResponse = await new InitTokenHolder({
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

    if (contractDeploymentResponse.receipt.status != '0x1') {
      console.log('TokenHolder1 Contract deployment failed');
      shell.exit(1);
    }

    let tokenHolderContractAddress = contractDeploymentResponse.receipt.contractAddress;
    oThis._addConfig({
      tokenHolderContractAddress1: tokenHolderContractAddress
    });

    let currentBlockNumber = await web3Provider.eth.getBlockNumber(),
      spendingLimit = new BigNumber('10000000000000000000000000000'),
      expirationHeight = new BigNumber(currentBlockNumber).add('10000000000000000000000000000');

    await web3Provider.eth.personal.unlockAccount(configFileContent.wallet1, passphrase);

    // Authorize an ephemeral public key
    let authorizeSession1Response = await contractDeploymentResponse.instance.methods
      .authorizeSession(configFileContent.ephemeralKey1, spendingLimit.toString(10), expirationHeight.toString(10))
      .send({
        from: configFileContent.wallet1,
        gasPrice: configFileContent.gasPrice,
        gasLimit: configFileContent.gasLimit
      });

    //console.log('authorizeSession1Response', JSON.stringify(authorizeSession1Response, null));

    await web3Provider.eth.personal.unlockAccount(configFileContent.wallet2, passphrase);

    // Authorize an ephemeral public key
    let authorizeSession2Response = await contractDeploymentResponse.instance.methods
      .authorizeSession(configFileContent.ephemeralKey1, spendingLimit.toString(10), expirationHeight.toString(10))
      .send({
        from: configFileContent.wallet2,
        gasPrice: configFileContent.gasPrice,
        gasLimit: configFileContent.gasLimit
      });

    //console.log('authorizeSession2Response', JSON.stringify(authorizeSession2Response, null));

    let isAuthorizedEphemeralKeyResponse = await contractDeploymentResponse.instance.methods
      .isAuthorizedEphemeralKey(configFileContent.ephemeralKey1)
      .call({});

    if (isAuthorizedEphemeralKeyResponse !== true) {
      console.log('isAuthorizedEphemeralKeyResponse return false for key:', configFileContent.ephemeralKey1);
      shell.exit(1);
    } else {
      console.log('Authorization of ephemeral key 1 done!!!');
    }

    oThis.tokenHolderContractInstance1 = contractDeploymentResponse.instance;

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

    let OpenST = require('../index.js');
    let openST = new OpenST(web3Provider);

    let InitTokenHolder = openST.setup.InitTokenHolder;

    console.log('* Deploying Token Holder Contract2');

    let requirement = 2,
      wallets = [configFileContent.wallet1, configFileContent.wallet2];

    let contractDeploymentResponse = await new InitTokenHolder({
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

    if (contractDeploymentResponse.receipt.status != '0x1') {
      console.log('TokenHolder2 Contract deployment failed');
      shell.exit(1);
    }

    let tokenHolderContractAddress = contractDeploymentResponse.receipt.contractAddress;
    oThis._addConfig({
      tokenHolderContractAddress2: tokenHolderContractAddress
    });

    let currentBlockNumber = await web3Provider.eth.getBlockNumber(),
      spendingLimit = new BigNumber('10000000000000000000000000000'),
      expirationHeight = new BigNumber('10000000000000000000000000000').add(currentBlockNumber);

    await web3Provider.eth.personal.unlockAccount(configFileContent.wallet1, passphrase);

    // Authorize an ephemeral public key
    let authorizeSession1Response = await contractDeploymentResponse.instance.methods
      .authorizeSession(configFileContent.ephemeralKey2, spendingLimit.toString(10), expirationHeight.toString(10))
      .send({
        from: configFileContent.wallet1,
        gasPrice: configFileContent.gasPrice,
        gasLimit: configFileContent.gasLimit
      });

    //console.log('authorizeSession1Response', JSON.stringify(authorizeSession1Response, null));

    await web3Provider.eth.personal.unlockAccount(configFileContent.wallet2, passphrase);

    // Authorize an ephemeral public key
    let authorizeSession2Response = await contractDeploymentResponse.instance.methods
      .authorizeSession(configFileContent.ephemeralKey2, spendingLimit.toString(10), expirationHeight.toString(10))
      .send({
        from: configFileContent.wallet2,
        gasPrice: configFileContent.gasPrice,
        gasLimit: configFileContent.gasLimit
      });

    //console.log('authorizeSession2Response', JSON.stringify(authorizeSession2Response, null));

    let isAuthorizedEphemeralKeyResponse = await contractDeploymentResponse.instance.methods
      .isAuthorizedEphemeralKey(configFileContent.ephemeralKey2)
      .call({});

    if (isAuthorizedEphemeralKeyResponse !== true) {
      console.log('isAuthorizedEphemeralKeyResponse return false for key:', configFileContent.ephemeralKey1);
      shell.exit(1);
    } else {
      console.log('Authorization of ephemeral key 2 done!!!');
    }

    return contractDeploymentResponse;
  },

  _fundERC20ToToken: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8')),
      amountToTransfer = new BigNumber('1000000000000000000000');

    console.log('Funding ERC20 tokens to token holder 1:', configFileContent.tokenHolderContractAddress1);
    await oThis.erc20ContractInstance.methods
      .transfer(configFileContent.tokenHolderContractAddress1, amountToTransfer.toString(10))
      .send({
        from: configFileContent.deployerAddress,
        gasPrice: configFileContent.gasprice,
        gasLimit: configFileContent.gasLimit
      });
    let tokenHolderBalance1 = await oThis.erc20ContractInstance.methods
      .balanceOf(configFileContent.tokenHolderContractAddress1)
      .call({});
    if (tokenHolderBalance1.toString(10) != amountToTransfer.toString(10)) {
      console.log('Funding of tokenholder1 contracts failed!');
      shell.exit(1);
    }

    console.log('Funding ERC20 tokens to token holder 2:', configFileContent.tokenHolderContractAddress2);
    await oThis.erc20ContractInstance.methods
      .transfer(configFileContent.tokenHolderContractAddress2, amountToTransfer.toString(10))
      .send({
        from: configFileContent.deployerAddress,
        gasPrice: configFileContent.gasprice,
        gasLimit: configFileContent.gasLimit
      });
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

    let OpenST = require('../index.js');
    let openST = new OpenST(web3Provider);

    let InitTransferRule = openST.setup.InitTransferRule;

    console.log('* Deploying Transfer Rule Contract');

    let contractDeploymentResponse = await new InitTransferRule({
      deployerAddress: deployerAddress,
      deployerPassphrase: passphrase,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      args: [configFileContent.tokenRulesContractAddress]
    }).perform();

    if (contractDeploymentResponse.receipt.status != '0x1') {
      console.log('Transfer Rule contract deployment failed: ', JSON.stringify(registerRuleResponse));
      shell.exit(1);
    }

    let transferRuleContractAddress = contractDeploymentResponse.receipt.contractAddress;
    oThis._addConfig({
      transferRuleContractAddress: transferRuleContractAddress
    });

    // Register Rule in TokenRules Contract
    let ruleName = 'TransferRule';
    await web3Provider.eth.personal.unlockAccount(configFileContent.organizationAddress, passphrase);
    let registerRuleResponse = await oThis.tokenRulesContractInstance.methods
      .registerRule(ruleName, transferRuleContractAddress)
      .send({
        from: configFileContent.organizationAddress,
        gasPrice: configFileContent.gasPrice,
        gasLimit: configFileContent.gasLimit
      });
    if (registerRuleResponse.status != '0x1') {
      console.log('Transfer Rule registration failed', JSON.stringify(registerRuleResponse));
      shell.exit(1);
    }

    // let rulesByAddressResponse = await oThis.tokenRulesContractInstance.methods
    //   .rulesByName(ruleName)
    //   .call({});
    //
    // console.log("rulesByAddressResponse:", rulesByAddressResponse);
    // if(rulesByAddressResponse[0] != ruleName) {
    //   console.log("Rule registration failed");
    //   shell.exit(1);
    // }
    console.log('Registration of rule completed!!!');
    oThis.transferRuleContractInstance = contractDeploymentResponse.instance;

    return registerRuleResponse;
  },

  _executeRule: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let ephemeralKey1Data = await oThis.tokenHolderContractInstance1.methods
      .ephemeralKeys(configFileContent.ephemeralKey1)
      .call({});
    let bigNumberNonce = new BigNumber(ephemeralKey1Data[1]),
      ephemeralKey1Nonce = bigNumberNonce.add(1).toString(10),
      amountToTransfer = new BigNumber(111111);

    let executableData = await oThis.transferRuleContractInstance.methods
      .transferFrom(
        configFileContent.tokenHolderContractAddress1,
        configFileContent.tokenHolderContractAddress2,
        amountToTransfer
      )
      .encodeABI();
    // Get 0x + first 8(4 bytes) characters
    let callPrefix = executableData.substring(0, 10),
      web3Provider = new Web3(configFileContent.gethRpcEndPoint);
    let messageToBeSigned = await web3Provider.utils.soliditySha3(
      { t: 'bytes', v: '0x19' }, // prefix
      { t: 'bytes', v: '0x00' }, // version control
      { t: 'address', v: configFileContent.tokenHolderContractAddress1 },
      { t: 'address', v: configFileContent.transferRuleContractAddress },
      { t: 'uint8', v: '0' },
      { t: 'bytes', v: executableData },
      { t: 'uint256', v: ephemeralKey1Nonce }, // nonce
      { t: 'uint8', v: '0' },
      { t: 'uint8', v: '0' },
      { t: 'uint8', v: '0' },
      { t: 'bytes', v: callPrefix },
      { t: 'uint8', v: '0' },
      { t: 'bytes', v: '0x' }
    );
    // configFileContent.ephemeralKey1 is signer here
    await web3Provider.eth.personal.unlockAccount(configFileContent.ephemeralKey1, passphrase);
    let signature = await web3Provider.eth.sign(messageToBeSigned, configFileContent.ephemeralKey1);
    signature = signature.slice(2);

    let r = '0x' + signature.slice(0, 64),
      s = '0x' + signature.slice(64, 128),
      v = web3Provider.utils.toDecimal('0x' + signature.slice(128, 130));
    if (v < 27) {
      v += 27;
    }

    // console.log(
    //   'signer',
    //   configFileContent.ephemeralKey1,
    //   'ephemeralKey1Nonce:',
    //   ephemeralKey1Nonce,
    //   'executableData:',
    //   executableData,
    //   'callPrefix',
    //   callPrefix,
    //   'messageToBeSigned',
    //   messageToBeSigned,
    //   'signature',
    //   signature
    // );
    let receiverBalanceBeforeExecuteRule = new BigNumber(
      await oThis.erc20ContractInstance.methods.balanceOf(configFileContent.tokenHolderContractAddress2).call({})
    );
    await web3Provider.eth.personal.unlockAccount(configFileContent.facilitator, passphrase);
    let executeRuleResponse = await oThis.tokenHolderContractInstance1.methods
      .executeRule(
        configFileContent.tokenHolderContractAddress1,
        configFileContent.transferRuleContractAddress,
        ephemeralKey1Nonce,
        executableData,
        callPrefix,
        v,
        r,
        s
      )
      .send({
        from: configFileContent.facilitator,
        gasPrice: configFileContent.gasPrice,
        gasLimit: configFileContent.gasLimit
      });
    //console.log('executeRuleResponse:', JSON.stringify(executeRuleResponse));
    if (executeRuleResponse.status != '0x1') {
      console.log('executeRuleResponse failed: ', JSON.stringify(executeRuleResponse));
      shell.exit(1);
    }
    let receiverBalanceAfterExecuteRule = new BigNumber(
      await oThis.erc20ContractInstance.methods.balanceOf(configFileContent.tokenHolderContractAddress2).call({})
    );
    if (receiverBalanceBeforeExecuteRule.add(amountToTransfer).equals(receiverBalanceAfterExecuteRule)) {
      console.log(
        'Execute Rule Worked Fine!',
        'receiverBalanceBeforeExecuteRule',
        receiverBalanceBeforeExecuteRule.toString(10),
        'receiverBalanceAfterExecuteRule',
        receiverBalanceAfterExecuteRule.toString(10)
      );
    } else {
      console.log('Balance mismatch after execute rule!');
      shell.exit(1);
    }

    return executeRuleResponse;
  },

  _fundEthFor: function(web3Provider, senderAddr, recipient, amount) {
    return web3Provider.eth.personal.unlockAccount(senderAddr, passphrase).then(function() {
      return web3Provider.eth.sendTransaction({
        from: senderAddr,
        to: recipient,
        value: amount,
        gasPrice: setUpConfig.chain.gasprice,
        gasLimit: setUpConfig.chain.gasLimit
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
