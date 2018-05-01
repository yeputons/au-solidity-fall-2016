const Moycoin = artifacts.require("Moycoin");

contract("Moycoin", async (accounts) => {
  let coin;

  before(async () => {
    coin = await Moycoin.new(123456);
  });

  it("returns correct name", async () => {
    assert.equal(await coin.name.call(), "Moycoin");
  });

  it("returns correct symbol", async () => {
    assert.equal(await coin.symbol.call(), "MOY");
  });

  it("returns correct decimals", async () => {
    assert.equal(await coin.decimals.call(), 1);
  });

  it("returns correct totalSupply", async () => {
    assert.equal(await coin.totalSupply.call(), 123456);
  });

  it("provides initial balance for the creator only", async () => {
    assert.equal(await coin.balanceOf.call(accounts[0]), 123456);
    assert.equal(await coin.balanceOf.call(accounts[1]), 0);
    assert.equal(await coin.balanceOf.call(accounts[2]), 0);
    assert.equal(await coin.balanceOf.call(0), 0);
  });
});
