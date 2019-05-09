'use strict';

const Web3 = require('web3');
const { assert } = require('chai');

const TokenHolder = require('../../../lib/ContractInteract/TokenHolder');

describe('TokenHolder.getCoGatewayRedeemExecutableData()', () => {
  let tokenHolder;

  beforeEach(() => {
    const web3 = new Web3();
    const address = '0x0000000000000000000000000000000000000002';
    tokenHolder = new TokenHolder(web3, address);
  });

  it('should create the correct abi encoded data', async () => {
    const amount = '100';
    const beneficiary = '0x0000000000000000000000000000000000000005';
    const gasPrice = '300';
    const gasLimit = '10000000';
    const nonce = '4';
    const hashLock = '0x0000000000000000000000000000000000000000000000000000000000000002';

    const encodedAbi = tokenHolder.getCoGatewayRedeemExecutableData(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock
    );

    // Hard-coding the expected ABI. Re-generating it would just be a duplication of the existing
    // code. This will also reveal unintentional interface changes.
    const expectedEncodedAbi =
      '0xbf41b9d900000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000012c000000000000000000000000000000000000000000000000000000000098968000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002';
    assert.strictEqual(
      encodedAbi,
      expectedEncodedAbi,
      'The encoded ABI from TokenHolders does not matched the expected one.'
    );
  });
});
