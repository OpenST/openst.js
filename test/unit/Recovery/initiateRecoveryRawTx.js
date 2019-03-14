'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const Recovery = require('../../../lib/ContractInteract/Recovery');
const AssertAsync = require('../../../utils/AssertAsync');

describe('Recovery.initiateRecoveryRawTx()', () => {
  let recovery;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const recoveryAddress = '0x0000000000000000000000000000000000000002';
    recovery = new Recovery(web3, recoveryAddress);
  });

  it('should return correct raw tx', async () => {
    const mockTx = 'mockTx';

    const spyRawTx = sinon.replace(recovery.contract.methods, 'initiateRecovery', sinon.fake.resolves(mockTx));

    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';
    const r = 'r';
    const v = 'v';
    const s = 's';

    const response = await recovery.initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, r, s, v);

    assert.strictEqual(response, mockTx, 'It must return correct raw tx');

    Spy.assert(spyRawTx, 1, [[prevOwner, oldOwner, newOwner, r, s, v]]);
    sinon.restore();
  });

  it('should throw an error when previous Owner is invalid', async () => {
    const prevOwner = undefined;
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';
    const r = 'r';
    const v = 'v';
    const s = 's';

    await AssertAsync.reject(
      recovery.initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, r, s, v),
      `Mandatory Parameter 'prevOwner' is missing or invalid: ${prevOwner}.`
    );
  });

  it('should throw an error when old owner is invalid', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = undefined;
    const newOwner = '0x0000000000000000000000000000000000000005';
    const r = 'r';
    const v = 'v';
    const s = 's';

    await AssertAsync.reject(
      recovery.initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, r, s, v),
      `Mandatory Parameter 'oldOwner' is missing or invalid: ${oldOwner}.`
    );
  });

  it('should throw an error when new owner is invalid', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = undefined;
    const r = 'r';
    const v = 'v';
    const s = 's';

    await AssertAsync.reject(
      recovery.initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, r, s, v),
      `Mandatory Parameter 'newOwner' is missing or invalid: ${newOwner}.`
    );
  });

  it('should throw an error when r of signature is invalid', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';
    const r = undefined;
    const v = 'v';
    const s = 's';

    await AssertAsync.reject(
      recovery.initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, r, s, v),
      `Invalid r of signature: ${r}.`
    );
  });

  it('should throw an error when  r of signature is invalid', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';
    const r = 'r';
    const v = undefined;
    const s = 's';

    await AssertAsync.reject(
      recovery.initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, r, s, v),
      `Invalid v of signature: ${v}.`
    );
  });

  it('should throw an error when  r of signature is invalid', async () => {
    const prevOwner = '0x0000000000000000000000000000000000000003';
    const oldOwner = '0x0000000000000000000000000000000000000004';
    const newOwner = '0x0000000000000000000000000000000000000005';
    const r = 'r';
    const v = 'v';
    const s = undefined;

    await AssertAsync.reject(
      recovery.initiateRecoveryRawTx(prevOwner, oldOwner, newOwner, r, s, v),
      `Invalid s of signature: ${s}.`
    );
  });
});
