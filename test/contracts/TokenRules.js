/**
 * Sample Rule Execute
 */

// Load external packages
const chai = require('chai'),
  assert = chai.assert;

const config = require('../../test/utils/configReader'),
  abis = require('../../test/utils/abis'),
  Web3WalletHelper = require('../../test/utils/Web3WalletHelper');

let openST,
  deployParams,
  erc20TokenContractAddress,
  tokenRulesContractAddress,
  tokenHolderContractAddress,
  sampleCustomRuleContractAddress,
  ephemeralKeyAccount;

const ruleName = 'transferFrom';

let registerRule = async function(openST, tokenRulesContractAddress, ruleName, ruleContractAddress, ruleAbi) {
  ruleAbi = JSON.stringify(ruleAbi);

  let tokenRules = new openST.contracts.TokenRules(tokenRulesContractAddress);

  console.log('* registerRule with _ruleName:', ruleName, '_ruleAddress:', ruleContractAddress, '_ruleAbi:', ruleAbi);

  let registerRuleResponse = await tokenRules.registerRule(ruleName, ruleContractAddress, ruleAbi).send({
    from: config.organizationAddress,
    gasPrice: config.gasPrice,
    gas: config.gas
  });

  assert.isOk(registerRuleResponse.events.RuleRegistered, 'RuleRegistered event not obtained.');

  console.log('** RuleRegistered event obtained.');
};

// Load cache service
describe('test/sampleRuleExecute', function() {
  before(async function() {
    // Creating object of OpenST
    const OpenST = require('../../index.js');
    openST = new OpenST(config.gethRpcEndPoint);

    deployParams = {
      from: config.deployerAddress,
      gasPrice: config.gasPrice,
      gas: config.gas
    };

    // adding the addresses to the web3 wallet
    let web3WalletHelper = new Web3WalletHelper(openST.web3());
    await web3WalletHelper.init();

    let deployer = new openST.Deployer(deployParams);
    // deploy ERC20
    console.log('* Deploying ERC20 Token');
    let erc20DeployReceipt = await deployer.deployERC20Token();
    erc20TokenContractAddress = erc20DeployReceipt.contractAddress;

    // deploy TokenRules
    console.log('* Deploying TokenRules');
    let tokenRulesDeployReceipt = await deployer.deployTokenRules(
      config.organizationAddress,
      erc20TokenContractAddress
    );
    tokenRulesContractAddress = tokenRulesDeployReceipt.contractAddress;

    console.log('* Deploying Sample Custom Rule');
    let sampleCustomRuleDeployReceipt = await deployer.deploySimpleTransferRule(tokenRulesContractAddress);
    sampleCustomRuleContractAddress = sampleCustomRuleDeployReceipt.contractAddress;
  });

  it('Register Rule', async function() {
    console.log('* Registering Sample Custom Rule');
    await registerRule(
      openST,
      tokenRulesContractAddress,
      ruleName,
      sampleCustomRuleContractAddress,
      abis.sampleCustomRule
    );
  });
});
