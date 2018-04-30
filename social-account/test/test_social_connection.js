var SocialAccount = artifacts.require("SocialAccount");
var SocialConnection = artifacts.require("SocialConnection");

const PROPOSED = 0;
const ACCEPTED = 1;
const CANCELLED = 2;

contract("SocialConnection", async (accounts) => {
  it("should initialize correctly", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    assert.equal(await conn.initiator.call(), accounts[1]);
    assert.equal(await conn.acceptor.call(), accounts[2]);
    assert.equal(await conn.status.call(), PROPOSED);
  });

  it("can be accepted", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    await conn.accept({from: accounts[2]});
    assert.equal(await conn.initiator.call(), accounts[1]);
    assert.equal(await conn.acceptor.call(), accounts[2]);
    assert.equal(await conn.status.call(), ACCEPTED);
  });

  it("cannot be accepted by other account", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    await expectThrow(conn.accept({from: accounts[0]}));
    await expectThrow(conn.accept({from: accounts[1]}));
    assert.equal(await conn.status.call(), PROPOSED);
  });
});

// https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/helpers/expectThrow.js
let expectThrow = async promise => {
  try {
    await promise;
  } catch (error) {
    // TODO: Check jump destination to destinguish between a throw
    //       and an actual invalid jump.
    const invalidOpcode = error.message.search('invalid opcode') >= 0;
    // TODO: When we contract A calls contract B, and B throws, instead
    //       of an 'invalid jump', we get an 'out of gas' error. How do
    //       we distinguish this from an actual out of gas event? (The
    //       ganache log actually show an 'invalid jump' event.)
    const outOfGas = error.message.search('out of gas') >= 0;
    const revert = error.message.search('revert') >= 0;
    assert(
      invalidOpcode || outOfGas || revert,
      'Expected throw, got \'' + error + '\' instead',
    );
    return;
  }
  assert.fail('Expected throw not received');
};
