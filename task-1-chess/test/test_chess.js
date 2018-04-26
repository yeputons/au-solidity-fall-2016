var Chess = artifacts.require("Chess");

contract("Chess", async (accounts) => {
  it("should initialize with empty game", async () => {
    let chess = await Chess.new(accounts[0], accounts[1]);
    assert.equal(await chess.white.call(), accounts[0]);
    assert.equal(await chess.black.call(), accounts[1]);
    assert.equal(await chess.whitesTurnNext.call(), true);
    assert.equal(await chess.turnsCount.call(), 0);
  });
});
