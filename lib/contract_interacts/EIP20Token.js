'use strict';

const InstanceComposer = require('../../instance_composer');
const generator = require('../../lib/contract_interacts/generator');

const path = require('path'),
    fs = require('fs');

require('../../providers/AuxiliaryWeb3');

function parseFile(filePath, options) {
    filePath = path.join(__dirname, '/' + filePath);
    const fileContent = fs.readFileSync(filePath, options || 'utf8');
    return JSON.parse(fileContent);
}

const eip20TokenJsonInterface = parseFile('../../contracts/abi/EIP20Token.abi', 'utf8');

const EIP20Token = function(auxiliaryConfig, auxiliaryAddress, auxiliaryOptions) {
    const oThis = this,
        AuxiliaryWeb3 = new oThis.ic().AuxiliaryWeb3(),
        auxiliaryWeb3Obj = new AuxiliaryWeb3(auxiliaryConfig),
        auxiliaryEIP20Token = new auxiliaryWeb3Obj.eth.Contract(eip20TokenJsonInterface, auxiliaryAddress, auxiliaryOptions || {});

    oThis._getAuxiliaryContract = function() {
        return auxiliaryEIP20Token;
    };

    //Bind eip20token auxiliary methods.
    generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};
const proto = (EIP20Token.prototype = {
    constructor: EIP20Token,
    _getAuxiliaryContract: null
});

let auxiliaryContractAbi = eip20TokenJsonInterface;
let auxiliaryContractGetter = '_getAuxiliaryContract';
generator(proto, null, null, auxiliaryContractAbi, auxiliaryContractGetter);

InstanceComposer.registerShadowableClass(EIP20Token, 'EIP20Token');

module.exports = TokenHolder;
