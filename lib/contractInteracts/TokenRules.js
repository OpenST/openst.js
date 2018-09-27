'use strict';

const path = require('path'),
  fs = require('fs');

const InstanceComposer = require('../../instance_composer');
const generator = require('./generator');

function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || 'utf8');
  return JSON.parse(fileContent);
}

const tokenRulesJsonInterface = parseFile('../../contracts/abi/TokenRules.abi', 'utf8');

const TokenRules = function(tokenRulesContractAddress) {
  const oThis = this,
    web3Obj = oThis.ic().chainWeb3(),
    tokenRulesInstance = new web3Obj.eth.Contract(tokenRulesJsonInterface, tokenRulesContractAddress, {});

  oThis._getAuxiliaryContract = function() {
    return tokenRulesInstance;
  };

  //Bind TokenRules auxiliary methods.
  generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};

const proto = (TokenRules.prototype = {
  constructor: TokenRules,

  _getAuxiliaryContract: null,

  getRule: async function(ruleName) {
    const oThis = this;

    let web3 = oThis.ic().chainWeb3(),
      ruleNameHash = web3.utils.soliditySha3(ruleName);

    let rulesByNameHashResult = await oThis.rulesByNameHash(ruleNameHash).call({});

    let ruleStruct = await oThis.rules(rulesByNameHashResult.index).call({});

    let transferRuleAbi = JSON.parse(ruleStruct.ruleAbi),
      ruleContractAddress = ruleStruct.ruleAddress;

    return new web3.eth.Contract(transferRuleAbi, ruleContractAddress);
  }
});

let auxiliaryContractAbi = tokenRulesJsonInterface;
let auxiliaryContractGetter = '_getAuxiliaryContract';
generator(proto, null, null, auxiliaryContractAbi, auxiliaryContractGetter);

InstanceComposer.registerShadowableClass(TokenRules, 'TokenRules');

module.exports = TokenRules;
