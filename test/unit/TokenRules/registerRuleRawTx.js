'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const TokenRules = require('../../../lib/ContractInteract/TokenRules');
const AssertAsync = require('../../../utils/AssertAsync');

describe('TokenRules.registerRuleRawTx()', () => {
  let tokenRules;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const address = '0x0000000000000000000000000000000000000002';
    tokenRules = new TokenRules(web3, address);
  });

  it('should return correct raw tx', async () => {
    const mockTx = 'mockTx';

    const spyRawTx = sinon.replace(tokenRules.contract.methods, 'registerRule', sinon.fake.resolves(mockTx));

    const ruleName = 'mockRule';
    const ruleAddress = '0x0000000000000000000000000000000000000003';
    const ruleAbi = 'mockAbi';

    const response = await tokenRules.registerRuleRawTx(ruleName, ruleAddress, ruleAbi);

    assert.strictEqual(response, mockTx, 'It must return correct raw tx');

    Spy.assert(spyRawTx, 1, [[ruleName, ruleAddress, ruleAbi]]);
    sinon.restore();
  });

  it('should throw an error when rule address is undefined', async () => {
    const ruleName = 'mockRule';
    const ruleAddress = undefined;
    const ruleAbi = 'mockAbi';

    await AssertAsync.reject(
      tokenRules.registerRuleRawTx(ruleName, ruleAddress, ruleAbi),
      'Invalid ruleAddress: undefined.'
    );
  });

  it('should throw an error when rule name is undefined', async () => {
    const ruleName = undefined;
    const ruleAddress = '0x0000000000000000000000000000000000000003';
    const ruleAbi = 'mockAbi';

    await AssertAsync.reject(
      tokenRules.registerRuleRawTx(ruleName, ruleAddress, ruleAbi),
      'Invalid ruleName: undefined.'
    );
  });

  it('should throw an error when rule abi is undefined', async () => {
    const ruleName = 'mockRule';
    const ruleAddress = '0x0000000000000000000000000000000000000003';
    const ruleAbi = undefined;

    await AssertAsync.reject(
      tokenRules.registerRuleRawTx(ruleName, ruleAddress, ruleAbi),
      'Invalid ruleAbi: undefined.'
    );
  });
});
