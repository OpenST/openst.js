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

const eip20TokenJsonInterface = parseFile('../../contracts/abi/MockToken.abi', 'utf8');

const ERC20Token = function(auxiliaryConfig, auxiliaryAddress, auxiliaryOptions) {
  const oThis = this,
    AuxiliaryWeb3 = new oThis.ic().AuxiliaryWeb3(),
    auxiliaryWeb3Obj = new AuxiliaryWeb3(auxiliaryConfig),
    auxiliaryEIP20Token = new auxiliaryWeb3Obj.eth.Contract(
      eip20TokenJsonInterface,
      auxiliaryAddress,
      auxiliaryOptions || {}
    );

  oThis._getAuxiliaryContract = function() {
    return auxiliaryEIP20Token;
  };

  //Bind eip20token auxiliary methods.
  generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};
const proto = (ERC20Token.prototype = {
  constructor: ERC20Token,
  _getAuxiliaryContract: null
});

let auxiliaryContractAbi = eip20TokenJsonInterface;
let auxiliaryContractGetter = '_getAuxiliaryContract';
generator(proto, null, null, auxiliaryContractAbi, auxiliaryContractGetter);

InstanceComposer.registerShadowableClass(ERC20Token, 'ERC20Token');

module.exports = TokenHolder;
