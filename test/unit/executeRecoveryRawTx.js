'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../utils/Spy');
const Recovery = require('../../lib/ContractInteract/Recovery');
const AssertAsync = require('../../utils/AssertAsync');

describe('Recovery.executeRecoveryRawTx()', () => {
  let recovery;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const recoveryAddress = '0x0000000000000000000000000000000000000002';
    recovery = new Recovery(web3, recoveryAddress);
  });

  it('should return correct raw tx', async () => {
    const mockTx = 'mockTx';

    const spyRawTx = sinon.replace(recovery.contract.methods, 'executeRecovery', sinon.fake.resolves(mockTx));

    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';

    const response = await recovery.executeRecoveryRawTx(prevOwner, oldOwner, newOwner);

    assert.strictEqual(response, mockTx, 'It must return correct raw tx');

    Spy.assert(spyRawTx, 1, [[prevOwner, oldOwner, newOwner]]);
    sinon.restore();
  });

  it('should throw an error when previous Owner is invalid', async () => {
    const prevOwner = undefined;
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';

    await AssertAsync.reject(
      recovery.executeRecoveryRawTx(prevOwner, oldOwner, newOwner),
      `Mandatory Parameter 'prevOwner' is missing or invalid: ${prevOwner}.`
    );
  });

  it('should throw an error when old owner is invalid', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = undefined;
    const newOwner = '0x0000000000000000000000000000000000000005';

    await AssertAsync.reject(
      recovery.executeRecoveryRawTx(prevOwner, oldOwner, newOwner),
      `Mandatory Parameter 'oldOwner' is missing or invalid: ${oldOwner}.`
    );
  });

  it('should throw an error when new owner is invalid', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = undefined;

    await AssertAsync.reject(
      recovery.executeRecoveryRawTx(prevOwner, oldOwner, newOwner),
      `Mandatory Parameter 'newOwner' is missing or invalid: ${newOwner}.`
    );
  });
});
