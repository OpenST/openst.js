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

const tokenHolderJsonInterface = parseFile('../../contracts/abi/TokenHolder.abi', 'utf8');

const TokenHolder = function(tokenHolderContractAddress, auxiliaryOptions) {
  const oThis = this,
    web3Obj = new oThis.ic().configStrategy.web3Provider,
    tokenHolderInstance = new web3Obj.eth.Contract(
      tokenHolderJsonInterface,
      tokenHolderContractAddress,
      auxiliaryOptions || {}
    );

  oThis._getAuxiliaryContract = function() {
    return tokenHolderInstance;
  };

  //Bind Tokenholder auxiliary methods.
  generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};

const proto = (TokenHolder.prototype = {
  constructor: TokenHolder,

  _getAuxiliaryContract: null
});

let auxiliaryContractAbi = tokenHolderJsonInterface;
let auxiliaryContractGetter = '_getAuxiliaryContract';
generator(proto, null, null, auxiliaryContractAbi, auxiliaryContractGetter);

InstanceComposer.registerShadowableClass(TokenHolder, 'TokenHolder');

module.exports = TokenHolder;
