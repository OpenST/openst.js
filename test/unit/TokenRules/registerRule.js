'use strict';

const Web3 = require('web3');
const sinon = require('sinon');
const { assert } = require('chai');

const Spy = require('../../../utils/Spy');
const TokenRules = require('../../../lib/ContractInteract/TokenRules');
const AssertAsync = require('../../../utils/AssertAsync');
const Utils = require('../../../utils/Utils');

describe('TokenRules.registerRule()', () => {
  let tokenRules;
  let web3;

  beforeEach(() => {
    web3 = new Web3();
    const address = '0x0000000000000000000000000000000000000002';
    tokenRules = new TokenRules(web3, address);
  });

  it('should pass with correct params', async () => {
    const ruleName = 'mockRule';
    const ruleAddress = '0x0000000000000000000000000000000000000003';
    const ruleAbi = 'mockAbi';
    const txOptions = {
      from: '0x0000000000000000000000000000000000000006'
    };

    const mockRawTx = 'mockRawTx';
    const rawTx = sinon.replace(tokenRules, 'registerRuleRawTx', sinon.fake.resolves(mockRawTx));

    const spySendTransaction = sinon.replace(Utils, 'sendTransaction', sinon.fake.resolves(true));

    const response = await tokenRules.registerRule(ruleName, ruleAddress, ruleAbi, txOptions);
    assert.isTrue(response, 'registerRule should return true');
    Spy.assert(rawTx, 1, [[ruleName, ruleAddress, ruleAbi]]);
    Spy.assert(spySendTransaction, 1, [[mockRawTx, txOptions]]);
    sinon.restore();
  });

  it('should throw an error when transaction options is undefined', async () => {
    const ruleName = 'mockRule';
    const ruleAddress = '0x0000000000000000000000000000000000000003';
    const ruleAbi = 'mockAbi';
    const txOptions = undefined;

    await AssertAsync.reject(
      tokenRules.registerRule(ruleName, ruleAddress, ruleAbi, txOptions),
      'Invalid transaction options: undefined.'
    );
  });

  it('should throw an error when transaction options from is undefined', async () => {
    const ruleName = 'mockRule';
    const ruleAddress = '0x0000000000000000000000000000000000000003';
    const ruleAbi = 'mockAbi';
    const txOptions = {};

    await AssertAsync.reject(
      tokenRules.registerRule(ruleName, ruleAddress, ruleAbi, txOptions),
      'Invalid from address: undefined.'
    );
  });
});
