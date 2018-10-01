'use strict';

const shell = require('shelljs'),
  BigNumber = require('bignumber.js'),
  fs = require('fs'),
  path = require('path'),
  Web3 = require('web3'),
  shellAsyncCmd = require('node-cmd'),
  program = require('commander');

const setUpConfig = require('./config.js');

const gethFolder = setUpConfig.chain.gethFolder,
  passphrase = 'testtest',
  hexStartsWith = '0x',
  passwordFilePath = gethFolder + '/pwd',
  etherToWeiCinversion = new BigNumber('1000000000000000000');

const InitDevEnv = function(params) {
  const oThis = this;

  oThis.setupRoot = params.setupRoot;
  oThis.configJsonFilePath = oThis.setupRoot + '/' + 'config.json';
  oThis.gethShellPath = null;
};

InitDevEnv.prototype = {
  perform: async function() {
    const oThis = this;

    // remove earlier setup
    oThis._executeInShell('rm -rf ' + oThis.setupRoot + '/*');

    // create new setup folder
    oThis._executeInShell('mkdir -p ' + oThis.setupRoot);

    // create bin folder
    oThis._executeInShell('mkdir -p ' + oThis.setupRoot + '/bin');

    // create logs folder
    oThis._executeInShell('mkdir -p ' + oThis.setupRoot + '/logs');

    // init config json file
    oThis._initConfigFile();

    // init GETH
    oThis._initGeth();

    // start services
    await oThis._startServices();

    // geth checker
    await oThis._checkForServicesReady();

    // fund ETH
    await oThis._fundEth();
  },

  _initConfigFile: function() {
    const oThis = this;

    // create config file with default content
    oThis._executeInShell('echo {} > ' + oThis.configJsonFilePath);

    oThis._addConfig({
      chainId: setUpConfig.chain.chainId,
      networkId: setUpConfig.chain.networkId,
      gas: setUpConfig.chain.gas,
      gasPrice: setUpConfig.chain.gasprice,
      gethRpcEndPoint: oThis._rpcEndpoint(),
      gethWsEndPoint: oThis._wsEndpoint()
    });
  },

  _initGeth: function() {
    const oThis = this;

    oThis._executeInShell('mkdir -p ' + gethFolder);

    oThis._executeInShell('echo "' + passphrase + '" > ' + passwordFilePath);

    let chainOwnerAddress = oThis._generateAddress(gethFolder);
    let workerAddress = oThis._generateAddress(gethFolder);
    let deployerAddress = oThis._generateAddress(gethFolder);
    let facilitator = oThis._generateAddress(gethFolder);
    let miner = oThis._generateAddress(gethFolder);
    let opsAddress = oThis._generateAddress(gethFolder);
    let organizationAddress = oThis._generateAddress(gethFolder);
    let wallet1 = oThis._generateAddress(gethFolder);
    let wallet2 = oThis._generateAddress(gethFolder);
    let ephemeralKey1 = oThis._generateAddress(gethFolder);
    let ephemeralKey2 = oThis._generateAddress(gethFolder);

    oThis._modifyGenesisFile(
      setUpConfig.chain.chainId,
      chainOwnerAddress,
      setUpConfig.chain.allocAmount,
      setUpConfig.chain.gas,
      setUpConfig.chain.genesisFileTemplatePath,
      setUpConfig.chain.genesisFilePath
    );

    let initCmd = 'geth --datadir "' + gethFolder + '" init ' + setUpConfig.chain.genesisFilePath;
    console.log('_initGeth :: Geth Init. Command:\n', initCmd);
    oThis._executeInShell(initCmd);

    oThis._addConfig({
      chainOwnerAddress: chainOwnerAddress,
      workerAddress: workerAddress,
      deployerAddress: deployerAddress,
      facilitator: facilitator,
      miner: miner,
      opsAddress: opsAddress,
      organizationAddress: organizationAddress,
      wallet1: wallet1,
      wallet2: wallet2,
      ephemeralKey1: ephemeralKey1,
      ephemeralKey2: ephemeralKey2
    });

    let logFilePath = oThis.setupRoot + '/logs/geth.log';
    let startCmd =
      `geth --datadir '${gethFolder}'` +
      ` --networkid ${setUpConfig.chain.networkId}` +
      ` --port ${setUpConfig.chain.geth.port}` +
      ` --mine --minerthreads 1 --targetgaslimit ${setUpConfig.chain.gas} --gasprice 0x3B9ACA00` +
      ` --rpc --rpcapi eth,net,web3,personal,txpool --rpcaddr ${setUpConfig.chain.geth.host} --rpcport ${
        setUpConfig.chain.geth.rpcport
      }` +
      ` --ws --wsapi eth,net,web3,personal,txpool --wsaddr ${setUpConfig.chain.geth.host} --wsport ${
        setUpConfig.chain.geth.wsport
      } --wsorigins '*'` +
      ` --etherbase ${miner} --unlock ${miner} --password ${passwordFilePath}` +
      ` 2> ${logFilePath}`;

    console.log('chain start command:\n', startCmd);

    //Create shell script
    let shellScriptPath = oThis.setupRoot + '/bin/run-chain.sh';
    oThis._executeInShell(`echo '#!/bin/sh' > ${shellScriptPath}`);
    oThis._executeInShell(`echo "${startCmd}" >> ${shellScriptPath}`);

    oThis.gethShellPath = shellScriptPath;
  },

  _startServices: function() {
    const oThis = this;

    //Start Geth
    shellAsyncCmd.run(`sh ${oThis.gethShellPath}`);

    console.log('* Sleeping for 5 seconds. Lets wait for geth to come up.');
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        console.log('----- I am Awake.');
        resolve();
      }, 5000);
    });
  },

  _checkForServicesReady: function() {
    const oThis = this;

    let GethChecker = require('./GethChecker');

    return new GethChecker([oThis._rpcEndpoint()]).perform();
  },

  _fundEth: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let senderAddr = configFileContent.chainOwnerAddress,
      web3Instance = new Web3(oThis._rpcEndpoint()),
      amount = '1000000000000000000000';

    let ethRecipients = [
      'workerAddress',
      'deployerAddress',
      'facilitator',
      'miner',
      'opsAddress',
      'organizationAddress',
      'wallet1',
      'wallet2'
    ];

    console.log('senderAddr', senderAddr);

    let len = ethRecipients.length;
    while (len--) {
      let recipientName = ethRecipients[len];
      let recipient = configFileContent[recipientName];
      console.log(`* Funding ${recipientName} (${recipient}) with ${amount} Wei`);
      await oThis._fundEthFor(web3Instance, senderAddr, recipient, amount);
      console.log(`----- ${recipientName} (${recipient}) has received ${amount} Wei`);
    }
  },

  _fundEthFor: function(web3, senderAddr, recipient, amount) {
    return web3.eth.personal.unlockAccount(senderAddr, passphrase).then(function() {
      return web3.eth.sendTransaction({
        from: senderAddr,
        to: recipient,
        value: amount,
        gasPrice: setUpConfig.chain.gasprice,
        gas: setUpConfig.chain.gas
      });
    });
  },

  _generateAddress: function(gethPath) {
    const oThis = this;

    let addressGerationResponse = oThis._executeInShell(
      'geth --datadir ' + gethPath + ' account new --password ' + passwordFilePath
    );
    return addressGerationResponse.stdout
      .replace('Address: {', hexStartsWith)
      .replace('}', '')
      .trim();
  },

  _modifyGenesisFile: function(
    chainId,
    allocAmountToAddress,
    allocAmount,
    gas,
    chainGenesisTemplateLocation,
    chainGenesisLocation,
    sealerAddress
  ) {
    const oThis = this;

    let fileContent = JSON.parse(fs.readFileSync(chainGenesisTemplateLocation, 'utf8'));

    // Alloc balance to required address
    let allocAmountInWeis = new BigNumber(allocAmount).mul(etherToWeiCinversion).toString(16);
    let allocObject = {};
    allocObject[allocAmountToAddress] = { balance: hexStartsWith + allocAmountInWeis };
    fileContent.alloc = allocObject;

    // set chain id
    fileContent.config.chainId = chainId;

    // set gas limit
    let bnGas = new BigNumber(gas);
    fileContent.gas = hexStartsWith + bnGas.toString(16);

    console.log(JSON.stringify(fileContent));

    oThis._executeInShell("echo '" + JSON.stringify(fileContent) + "' > " + chainGenesisLocation);

    return true;
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
  },

  _rpcEndpoint: function() {
    return 'http://' + setUpConfig.chain.geth.host + ':' + setUpConfig.chain.geth.rpcport;
  },

  _wsEndpoint: function() {
    return 'ws://' + setUpConfig.chain.geth.host + ':' + setUpConfig.chain.geth.wsport;
  }
};

// commander
(function() {
  let defaultSetupPath = path.join(process.cwd(), './');
  program
    .version('0.1.0')
    .usage(`<path_to_setup_directory> (default: ${defaultSetupPath})`)
    .parse(process.argv);

  let setupRoot = program.args[0] || defaultSetupPath;
  setupRoot = path.resolve(setupRoot);

  try {
    let setupRootStats = fs.statSync(setupRoot);
    if (!setupRootStats.isDirectory()) {
      throw 'Invalid setup directory path.';
    }
  } catch (e) {
    console.log(e.message);
    process.exit(0);
  }

  setupRoot = path.resolve(setupRoot, './openst-setup');
  console.log('Creating openst-setup folder. path = ', setupRoot);

  new InitDevEnv({
    setupRoot: setupRoot
  })
    .perform()
    .then(function() {
      console.log('openst-setup development environment setup is complete');
      process.exit(0);
    })
    .catch(function(reason) {
      console.log('openst-setup development environment setup could not be completed.');
      process.exit(1);
    });
})();
