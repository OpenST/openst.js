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
  ephemeralKeyAccount,
  deployer;

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
describe('test/TokenRules', function() {
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

    deployer = new openST.Deployer(deployParams);
    // deploy ERC20
    console.log('* Deploying ERC20 Token');
    let erc20DeployReceipt = await deployer.deployERC20Token();
    erc20TokenContractAddress = erc20DeployReceipt.contractAddress;
  });

  //All Auto Generated Code needs to be tested more than once as prototype
  //of the class is being manipulated during construction of the instance.
  let noOfInstances = 2;

  while (noOfInstances--) {
    let descPostFix = noOfInstances ? '' : '(retest with new instance)';
    it(`it should deploy TokenRules ${descPostFix}`, () => {
      return deployer
        .deployTokenRules(config.organizationAddress, erc20TokenContractAddress)
        .then((tokenRulesDeployReceipt) => {
          tokenRulesContractAddress = tokenRulesDeployReceipt.contractAddress;
        });
    });

    it(`should deploy sample custom rule ${descPostFix}`, () => {
      return deployer.deploySimpleTransferRule(tokenRulesContractAddress).then((sampleCustomRuleDeployReceipt) => {
        sampleCustomRuleContractAddress = sampleCustomRuleDeployReceipt.contractAddress;
      });
    });

    it(`it should register rule ${descPostFix}`, () => {
      return registerRule(
        openST,
        tokenRulesContractAddress,
        ruleName,
        sampleCustomRuleContractAddress,
        abis.sampleCustomRule
      );
    });

    it(`it should fail to register rule with same name and address ${descPostFix}`, () => {
      let isSuccessfull = false;
      return registerRule(
        openST,
        tokenRulesContractAddress,
        ruleName,
        sampleCustomRuleContractAddress,
        abis.sampleCustomRule
      )
        .then((receipt) => {
          //Registeration was sucessfull.
          isSuccessfull = true;
          return Promise.reject(receipt);
        })
        .catch((reason) => {
          if (isSuccessfull) {
            return Promise.reject(reason);
          }
          Promise.resolve();
        });
    });
  }
});
