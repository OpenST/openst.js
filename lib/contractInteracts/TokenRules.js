'use strict';
const InstanceComposer = require('../../instance_composer');
//Generator Code Begins.
const generator = require('./generator');
let isProtoGenerated = false;
let generateProto = (proto, contractAbi, contractGetter) => {
  if (isProtoGenerated) {
    return;
  }
  generator(proto, null, null, contractAbi, contractGetter);
  isProtoGenerated = true;
};
//Generator Code Ends.

let contractJsonInterface;
const TokenRules = function(contractAddress, options) {
  const oThis = this;

  if (!contractJsonInterface) {
    //Fetch Interface.
    let abiBinProvider = oThis.ic().abiBinProvider();
    contractJsonInterface = abiBinProvider.getABI('TokenRules');
    generateProto(TokenRules.prototype, contractJsonInterface, '_getAuxiliaryContract');
  }

  options = options || {};
  const web3Obj = oThis.ic().chainWeb3(),
    contractInstance = new web3Obj.eth.Contract(contractJsonInterface, contractAddress, options);

  oThis._getAuxiliaryContract = function() {
    return contractInstance;
  };

  //Bind Tokenholder auxiliary methods.
  generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};

TokenRules.prototype = {
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
};

InstanceComposer.registerShadowableClass(TokenRules, 'TokenRules');

module.exports = TokenRules;
