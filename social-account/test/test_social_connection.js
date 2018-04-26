var SocialAccount = artifacts.require("SocialAccount");
var SocialConnection = artifacts.require("SocialConnection");

contract("SocialConnection", async (accounts) => {
  beforeEach(async () => {
    this.acc1 = (await SocialAccount.new("First", {from: accounts[1]})).address;
    this.acc2 = (await SocialAccount.new("Second", {from: accounts[2]})).address;
  });

  it("should initialize correctly", async () => {
    let conn = await SocialConnection.new(this.acc1, this.acc2, {from: accounts[1]});
    assert.equal(await conn.initiator.call(), this.acc1);
    assert.equal(await conn.acceptor.call(), this.acc2);
    assert.equal(await conn.accepted.call(), false);
  });

  it("can be accepted", async () => {
    let conn = await SocialConnection.new(this.acc1, this.acc2, {from: accounts[1]});
    await conn.accept({from: accounts[2]});
    assert.equal(await conn.initiator.call(), this.acc1);
    assert.equal(await conn.acceptor.call(), this.acc2);
    assert.equal(await conn.accepted.call(), true);
  });

  it("cannot be accepted by other person", async () => {
    let conn = await SocialConnection.new(this.acc1, this.acc2, {from: accounts[1]});
    await expectThrow(conn.accept({from: accounts[0]}));
    await expectThrow(conn.accept({from: accounts[1]}));
  });

  it("cannot be created by other person", async () => {
    await expectThrow(SocialConnection.new(this.acc1, this.acc2, {from: accounts[0]}));
    await expectThrow(SocialConnection.new(this.acc1, this.acc2, {from: accounts[2]}));
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
