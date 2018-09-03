'use strict';

const InstanceComposer = require('../../instance_composer');
const generator = require('../../lib/contract_interacts/generator');

const path = require('path'),
  fs = require('fs');

function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || 'utf8');
  return JSON.parse(fileContent);
}

const tokenRulesJsonInterface = parseFile('../../contracts/abi/TokenRules.abi', 'utf8');

const TokenRules = function(auxiliaryConfig, auxiliaryAddress, auxiliaryOptions) {
  const oThis = this,
    AuxiliaryWeb3 = new oThis.ic().AuxiliaryWeb3(),
    auxiliaryWeb3Obj = new AuxiliaryWeb3(auxiliaryConfig),
    auxiliaryTokenHolder = new auxiliaryWeb3Obj.eth.Contract(
      tokenRulesJsonInterface,
      auxiliaryAddress,
      auxiliaryOptions || {}
    );

  oThis._getAuxiliaryContract = function() {
    return auxiliaryTokenHolder;
  };

  //Bind tokenholder auxiliary methods.
  generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};
const proto = (TokenRules.prototype = {
  constructor: TokenRules,
  _getAuxiliaryContract: null
});

let auxiliaryContractAbi = tokenRulesJsonInterface;
let auxiliaryContractGetter = '_getAuxiliaryContract';
generator(proto, null, null, auxiliaryContractAbi, auxiliaryContractGetter);

InstanceComposer.registerShadowableClass(TokenRules, 'TokenHolder');

module.exports = TokenRules;
