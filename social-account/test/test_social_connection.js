require("truffle-test-utils").init();
var SocialAccount = artifacts.require("SocialAccount");
var SocialConnection = artifacts.require("SocialConnection");

const PROPOSED = 0;
const ACCEPTED = 1;
const CANCELLED = 2;

contract("SocialConnection", async (accounts) => {
  it("should initialize correctly", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    let res = await web3.eth.getTransactionReceipt(conn.transactionHash);
    assert.equal(await conn.initiator.call(), accounts[1]);
    assert.equal(await conn.acceptor.call(), accounts[2]);
    assert.equal(await conn.status.call(), PROPOSED);
    assert.web3Event(res, {
      event: 'StatusUpdated',
      args: {
        connection: conn.address,
        from: accounts[1],
        to: accounts[2],
        oldStatus: PROPOSED,
        newStatus: PROPOSED
      },
    });
  });

  it("can be accepted", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    let res = await web3.eth.getTransactionReceipt(conn.transactionHash);
    await conn.accept({from: accounts[2]});
    assert.web3Event(res, {
      event: 'StatusUpdated',
      args: {
        connection: conn.address,
        from: accounts[1],
        to: accounts[2],
        oldStatus: PROPOSED,
        newStatus: ACCEPTED
      },
    });
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

  it("can be cancelled by initiator before acceptance", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    let res = await conn.cancel({from: accounts[1]});
    assert.equal(await conn.status.call(), CANCELLED);
    assert.web3Event(res, {
      event: 'StatusUpdated',
      args: {
        connection: conn.address,
        from: accounts[1],
        to: accounts[2],
        oldStatus: PROPOSED,
        newStatus: CANCELLED
      },
    });
  });

  it("can be cancelled by acceptor before acceptance", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    let res = await conn.cancel({from: accounts[2]});
    assert.equal(await conn.status.call(), CANCELLED);
    assert.web3Event(res, {
      event: 'StatusUpdated',
      args: {
        connection: conn.address,
        from: accounts[1],
        to: accounts[2],
        oldStatus: PROPOSED,
        newStatus: CANCELLED
      },
    });
  });

  it("cannot be cancelled by other accounts before acceptance", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    await expectThrow(conn.cancel({from: accounts[0]}));
    assert.equal(await conn.status.call(), PROPOSED);
  });

  it("can be cancelled by initator after acceptance", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    await conn.accept({from: accounts[2]});
    let res = await conn.cancel({from: accounts[1]});
    assert.equal(await conn.status.call(), CANCELLED);
    assert.web3Event(res, {
      event: 'StatusUpdated',
      args: {
        connection: conn.address,
        from: accounts[1],
        to: accounts[2],
        oldStatus: ACCEPTED,
        newStatus: CANCELLED
      },
    });
  });

  it("can be cancelled by acceptor after acceptance", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    await conn.accept({from: accounts[2]});
    let res = await conn.cancel({from: accounts[2]});
    assert.equal(await conn.status.call(), CANCELLED);
    assert.web3Event(res, {
      event: 'StatusUpdated',
      args: {
        connection: conn.address,
        from: accounts[1],
        to: accounts[2],
        oldStatus: ACCEPTED,
        newStatus: CANCELLED
      },
    });
  });

  it("cannot be cancelled by other accounts after acceptance", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    await conn.accept({from: accounts[2]});
    await expectThrow(conn.cancel({from: accounts[0]}));
    assert.equal(await conn.status.call(), ACCEPTED);
  });

  it("cannot be accepted after cancelling", async () => {
    let conn = await SocialConnection.new(accounts[2], {from: accounts[1]});
    await conn.cancel({from: accounts[2]});
    await expectThrow(conn.accept({from: accounts[2]}));
    await expectThrow(conn.accept({from: accounts[1]}));
    assert.equal(await conn.status.call(), CANCELLED);
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
