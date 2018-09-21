/**
 *
 * Sample Test
 *
 */

// Load external packages
const chai = require('chai'),
  assert = chai.assert;

// Load cache service
describe('test/sample', function() {
  it('should pass as it is a simple sample test', async function() {
    console.log('hello world!');
    assert.equal(true, true);
  });
});
