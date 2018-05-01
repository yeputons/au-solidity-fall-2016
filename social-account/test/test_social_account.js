require("truffle-test-utils").init();
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
    let res = await acc.setName("Other Name", {from: accounts[0]});
    assert.equal(await acc.name.call(), "Other Name");
    assert.web3Event(res, {
      event: 'NameChanged',
      args: {
        account: acc.address,
        oldName: "My Name",
        newName: "Other Name"
      },
    });
  });

  it("prohibits name changes by others", async () => {
    let acc = await SocialAccount.new("My Name");
    await expectThrow(acc.setName("Other Name", {from: accounts[1]}));
  });

  it("befriends other accounts", async() => {
    let acc1 = await SocialAccount.new("Name1");
    let acc2 = await SocialAccount.new("Name2");
    await acc1.addFriendWithAnyConnection(acc2.address);

    let conn = SocialConnection.at(await acc1.connections.call(acc2.address));
    assert.equal(await conn.initiator.call(), acc1.address);
    assert.equal(await conn.acceptor.call(), acc2.address);
    assert.equal(await conn.status.call(), PROPOSED);

    await acc2.addFriendWithAnyConnection(acc1.address);
    assert.equal(await conn.status.call(), ACCEPTED);
    assert.equal(await acc2.connections.call(acc1.address), conn.address);
  });

  [ACCEPTOR, INITIATOR].forEach(param => {
    it("befriends after acceptance and " + param + " cancels", async () => {
      let acc1 = await SocialAccount.new("Name1");
      let acc2 = await SocialAccount.new("Name2");
      await acc1.addFriendWithAnyConnection(acc2.address);
      let conn = SocialConnection.at(await acc1.connections.call(acc2.address));
      await acc2.addFriendWithAnyConnection(acc1.address);

      if (param == INITIATOR) {
        await acc1.removeFriend(acc2.address);
      } else if (param == ACCEPTOR) {
        await acc2.removeFriend(acc1.address);
      } else {
        assert.isTrue(false);
      }

      assert.equal(await conn.status.call(), CANCELLED);
      assert.oneOf(await acc1.connections.call(acc2.address), [ZERO_ADDRESS, conn.address]);
      assert.oneOf(await acc2.connections.call(acc1.address), [ZERO_ADDRESS, conn.address]);

      await acc1.addFriendWithAnyConnection(acc2.address);
      let conn2 = SocialConnection.at(await acc1.connections.call(acc2.address));
      assert.equal(await conn2.status.call(), PROPOSED);

      await acc2.addFriendWithAnyConnection(acc1.address);
      assert.equal(await conn2.status.call(), ACCEPTED);
      assert.equal(await acc1.connections.call(acc2.address), conn2.address);
      assert.equal(await acc2.connections.call(acc1.address), conn2.address);
      assert.equal(await conn.status.call(), CANCELLED);
    });
  });

  it("accepts deposits from anybody", async () => {
    const acc = await SocialAccount.new("Name");
    const res1 = await acc.deposit({value: 100});
    const res2 = await acc.deposit({value: 50, from: accounts[1]});
    assert.equal(await web3.eth.getBalance(acc.address), 150);
    assert.web3Event(res1, {
      event: "Deposited",
      args: {
        account: acc.address,
        from: accounts[0],
        value: 100
      }
    });
    assert.web3Event(res2, {
      event: "Deposited",
      args: {
        account: acc.address,
        from: accounts[1],
        value: 50
      }
    });
  });

  it("allows owner to withdraw ether", async () => {
    const acc = await SocialAccount.new("Name");
    await acc.deposit({value: 50, from: accounts[1]});

    {
      const balanceBefore = await web3.eth.getBalance(accounts[0]);
      const rx = await acc.withdraw(40, {gasPrice: 0});
      assert.equal(await web3.eth.getBalance(acc.address), 10);

      const balanceAfter = await web3.eth.getBalance(accounts[0]);
      assert.equal(balanceAfter.sub(balanceBefore), 40);
    }

    await expectThrow(acc.withdraw(40));

    {
      const balanceBefore = await web3.eth.getBalance(accounts[0]);
      await acc.withdraw(10, {gasPrice: 0});
      assert.equal(await web3.eth.getBalance(acc.address), 0);

      const balanceAfter = await web3.eth.getBalance(accounts[0]);
      assert.equal(balanceAfter.sub(balanceBefore), 10);
    }
  });

  it("prohibits others from withdrawing", async () => {
    const acc = await SocialAccount.new("Name");
    await acc.deposit({value: 50, from: accounts[1]});

    await expectThrow(acc.withdraw(40, {from: accounts[1]}));
  });

  it("allows transfers to friends only", async () => {
    let acc1 = await SocialAccount.new("Name1");
    let acc2 = await SocialAccount.new("Name2");
    await acc1.deposit({value: 100});

    await expectThrow(acc1.sendToFriend(acc2.address, 10));
    await acc1.addFriendWithAnyConnection(acc2.address);
    await expectThrow(acc1.sendToFriend(acc2.address, 10));
    await acc2.addFriendWithAnyConnection(acc1.address);

    assert.equal(web3.eth.getBalance(acc1.address), 100);
    assert.equal(web3.eth.getBalance(acc2.address), 0);
    let res = await acc1.sendToFriend(acc2.address, 10);
    assert.equal(web3.eth.getBalance(acc1.address), 90);
    assert.equal(web3.eth.getBalance(acc2.address), 10);

    assert.web3Event(res, {
      event: "EtherSent",
      args: {
        from: acc1.address,
        to: acc2.address,
        value: 10
      }
    });
  });

  it("disallows transfers to cancelled friends", async () => {
    let acc1 = await SocialAccount.new("Name1");
    let acc2 = await SocialAccount.new("Name2");
    await acc1.deposit({value: 100});
    await acc1.addFriendWithAnyConnection(acc2.address);
    await acc2.addFriendWithAnyConnection(acc1.address);

    await acc1.sendToFriend(acc2.address, 20);
    await acc2.sendToFriend(acc1.address, 10);

    await acc2.removeFriend(acc1.address);

    await expectThrow(acc1.sendToFriend(acc2.address, 2));
    await expectThrow(acc2.sendToFriend(acc1.address, 1));
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
