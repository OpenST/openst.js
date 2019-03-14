'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const Recovery = require('../../../lib/ContractInteract/Recovery');
const AssertAsync = require('../../../utils/AssertAsync');

describe('Recovery.resetRecoveryRawTx()', () => {
  let recovery;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const recoveryAddress = '0x0000000000000000000000000000000000000002';
    recovery = new Recovery(web3, recoveryAddress);
  });

  it('should return correct raw tx', async () => {
    const mockTx = 'mockTx';

    const spyRawTx = sinon.replace(recovery.contract.methods, 'resetRecoveryOwner', sinon.fake.resolves(mockTx));

    const newRecoveryOwner = '0x0000000000000000000000000000000000000003';
    const r = 'r';
    const v = 'v';
    const s = 's';

    const response = await recovery.resetRecoveryOwnerRawTx(newRecoveryOwner, r, s, v);

    assert.strictEqual(response, mockTx, 'It must return correct raw tx');

    Spy.assert(spyRawTx, 1, [[newRecoveryOwner, r, s, v]]);
    sinon.restore();
  });

  it('should throw an error when previous Owner is invalid', async () => {
    const newRecoveryOwner = undefined;
    const r = 'r';
    const v = 'v';
    const s = 's';

    await AssertAsync.reject(
      recovery.resetRecoveryOwnerRawTx(newRecoveryOwner, r, s, v),
      `Mandatory Parameter 'newRecoveryOwner' is missing or invalid: ${newRecoveryOwner}.`
    );
  });

  it('should throw an error when r of signature is invalid', async () => {
    const newRecoveryOwner = '0x0000000000000000000000000000000000000003';
    const r = undefined;
    const v = 'v';
    const s = 's';

    await AssertAsync.reject(
      recovery.resetRecoveryOwnerRawTx(newRecoveryOwner, r, s, v),
      `Invalid r of signature: ${r}.`
    );
  });

  it('should throw an error when  r of signature is invalid', async () => {
    const newRecoveryOwner = '0x0000000000000000000000000000000000000003';
    const r = 'r';
    const v = undefined;
    const s = 's';

    await AssertAsync.reject(
      recovery.resetRecoveryOwnerRawTx(newRecoveryOwner, r, s, v),
      `Invalid v of signature: ${v}.`
    );
  });

  it('should throw an error when  r of signature is invalid', async () => {
    const newRecoveryOwner = '0x0000000000000000000000000000000000000003';
    const r = 'r';
    const v = 'v';
    const s = undefined;

    await AssertAsync.reject(
      recovery.resetRecoveryOwnerRawTx(newRecoveryOwner, r, s, v),
      `Invalid s of signature: ${s}.`
    );
  });
});
