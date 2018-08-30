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

const tokenHolderJsonInterface = parseFile('../../contracts/abi/TokenHolder.abi', 'utf8');

const TokenHolder = function(auxiliaryConfig, auxiliaryAddress, auxiliaryOptions) {
    const oThis = this,
        AuxiliaryWeb3 = new oThis.ic().AuxiliaryWeb3(),
        auxiliaryWeb3Obj = new AuxiliaryWeb3(auxiliaryConfig),
        auxiliaryTokenHolder = new auxiliaryWeb3Obj.eth.Contract(tokenHolderJsonInterface, auxiliaryAddress, auxiliaryOptions || {});

    oThis._getAuxiliaryContract = function() {
        return auxiliaryTokenHolder;
    };

    //Bind tokenholder auxiliary methods.
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
