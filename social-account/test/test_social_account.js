var SocialAccount = artifacts.require("SocialAccount");
var SocialConnection = artifacts.require("SocialConnection");

const PROPOSED = 0;
const ACCEPTED = 1;
const CANCELLED = 2;

const ZERO_ADDRESS = "0x" + "0".repeat(40);

const ACCEPTOR = "acceptor";
const INITIATOR = "initiator";

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

  it("befriends other accounts", async() => {
    let acc1 = await SocialAccount.new("Name1");
    let acc2 = await SocialAccount.new("Name2");
    await acc1.addFriendWithAnyConnection(acc2.address);

    let conn = SocialConnection.at(await acc1.connections(acc2.address));
    assert.equal(await conn.initiator(), acc1.address);
    assert.equal(await conn.acceptor(), acc2.address);
    assert.equal(await conn.status(), PROPOSED);

    await acc2.addFriendWithAnyConnection(acc1.address);
    assert.equal(await conn.status(), ACCEPTED);
    assert.equal(await acc2.connections(acc1.address), conn.address);
  });

  [ACCEPTOR, INITIATOR].forEach(param => {
    it("befriends after acceptance and " + param + " cancels", async () => {
      let acc1 = await SocialAccount.new("Name1");
      let acc2 = await SocialAccount.new("Name2");
      await acc1.addFriendWithAnyConnection(acc2.address);
      let conn = SocialConnection.at(await acc1.connections(acc2.address));
      await acc2.addFriendWithAnyConnection(acc1.address);

      if (param == INITIATOR) {
        await acc1.removeFriend(acc2.address);
      } else if (param == ACCEPTOR) {
        await acc2.removeFriend(acc1.address);
      } else {
        assert.isTrue(false);
      }

      assert.equal(await conn.status(), CANCELLED);
      assert.oneOf(await acc1.connections(acc2.address), [ZERO_ADDRESS, conn.address]);
      assert.oneOf(await acc2.connections(acc1.address), [ZERO_ADDRESS, conn.address]);

      await acc1.addFriendWithAnyConnection(acc2.address);
      let conn2 = SocialConnection.at(await acc1.connections(acc2.address));
      assert.equal(await conn2.status(), PROPOSED);

      await acc2.addFriendWithAnyConnection(acc1.address);
      assert.equal(await conn2.status(), ACCEPTED);
      assert.equal(await acc1.connections(acc2.address), conn2.address);
      assert.equal(await acc2.connections(acc1.address), conn2.address);
      assert.equal(await conn.status(), CANCELLED);
    });
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
