'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const TokenRules = require('../../../lib/ContractInteract/TokenRules');

describe('TokenRules.getDirectTransferExecutableData()', () => {
  let tokenRules;

  beforeEach(() => {
    const web3 = new Web3();
    const address = '0x0000000000000000000000000000000000000002';
    tokenRules = new TokenRules(web3, address);
  });

  it('should construct with correct parameters', async () => {
    const transferTos = ['0x0000000000000000000000000000000000000003'];
    const transferAmounts = ['10'];

    const mockDirectTransferExecutableData = 'mockDirectTransferExecutableData';
    const mockDirectTransferExecutableDataSpy = sinon.replace(
      tokenRules.contract.methods,
      'directTransfers',
      sinon.fake.returns({
        encodeABI: () => Promise.resolve(mockDirectTransferExecutableData)
      })
    );
    const response = await tokenRules.getDirectTransferExecutableData(transferTos, transferAmounts);

    assert.strictEqual(response, mockDirectTransferExecutableData);
    Spy.assert(mockDirectTransferExecutableDataSpy, 1, [[transferTos, transferAmounts]]);
  });
});
