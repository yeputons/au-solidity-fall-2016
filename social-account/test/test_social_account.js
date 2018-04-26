var SocialAccount = artifacts.require("SocialAccount");

contract("SocialAccount", async (accounts) => {
  it("should initialize correctly", async () => {
    let acc = await SocialAccount.new("My Name");
    assert.equal(await acc.owner.call(), accounts[0]);
    assert.equal(await acc.name.call(), "My Name");
  });

  it("allow name changes by owner", async () => {
    let acc = await SocialAccount.new("My Name");
    await acc.setName("Other Name", {from: accounts[0]});
    assert.equal(await acc.name.call(), "Other Name");
  });

  it("prohibits name changes by others", async () => {
    let acc = await SocialAccount.new("My Name");
    await expectThrow(acc.setName("Other Name", {from: accounts[1]}));
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
