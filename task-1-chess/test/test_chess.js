var Chess = artifacts.require("Chess");

let turn1 = "0x0123456780abcdef" + "0".repeat(48);
let turn2 = "0x0123456780abcdef" + "0".repeat(48);

contract("Chess", async (accounts) => {
  it("should initialize with empty game", async () => {
    let chess = await Chess.new(accounts[0], accounts[1]);
    assert.equal(await chess.white.call(), accounts[0]);
    assert.equal(await chess.black.call(), accounts[1]);
    assert.equal(await chess.whitesTurnNext.call(), true);
    assert.equal(await chess.turnsCount.call(), 0);
  });

  it("allows first turn from whites", async () => {
    let chess = await Chess.new(accounts[0], accounts[1]);
    await chess.makeTurn(turn1, {from: accounts[0]});
    assert.equal(await chess.white.call(), accounts[0]);
    assert.equal(await chess.black.call(), accounts[1]);
    assert.equal(await chess.whitesTurnNext.call(), false);
    assert.equal(await chess.turnsCount.call(), 1);
    assert.equal(await chess.turns.call(0), turn1);
  });

  it("prohibits first turn from others", async () => {
    let chess = await Chess.new(accounts[0], accounts[1]);
    await expectThrow(chess.makeTurn(turn1, {from: accounts[1]}));
    await expectThrow(chess.makeTurn(turn1, {from: accounts[2]}));
  });

  it("allows second turn from blacks", async () => {
    let chess = await Chess.new(accounts[0], accounts[1]);
    await chess.makeTurn(turn1, {from: accounts[0]});
    await chess.makeTurn(turn2, {from: accounts[1]});
    assert.equal(await chess.white.call(), accounts[0]);
    assert.equal(await chess.black.call(), accounts[1]);
    assert.equal(await chess.whitesTurnNext.call(), true);
    assert.equal(await chess.turnsCount.call(), 2);
    assert.equal(await chess.turns.call(0), turn1);
    assert.equal(await chess.turns.call(1), turn2);
  });

  it("prohibits second turn from others", async () => {
    let chess = await Chess.new(accounts[0], accounts[1]);
    await expectThrow(chess.makeTurn(turn1, {from: accounts[1]}));
    await expectThrow(chess.makeTurn(turn2, {from: accounts[2]}));
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
