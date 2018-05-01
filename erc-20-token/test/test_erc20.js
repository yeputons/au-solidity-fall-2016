const Moycoin = artifacts.require("Moycoin");

contract("Moycoin", async (accounts) => {
  before(async () => {
    this.coin = await Moycoin.new(123456, {gasLimit: 10000000});
  });

  it("returns correct name", async () => {
    assert.equal(await this.coin.name.call(), "Moycoin");
  });

  it("returns correct symbol", async () => {
    assert.equal(await this.coin.symbol.call(), "MOY");
  });

  it("returns correct decimals", async () => {
    assert.equal(await this.coin.decimals.call(), 1);
  });

  it("returns correct totalSupply", async () => {
    assert.equal(await this.coin.totalSupply.call(), 123456);
  });

  it("provides initial balance for the creator only", async () => {
    assert.equal(await this.coin.balanceOf.call(accounts[0]), 123456);
    assert.equal(await this.coin.balanceOf.call(accounts[1]), 0);
    assert.equal(await this.coin.balanceOf.call(accounts[2]), 0);
    assert.equal(await this.coin.balanceOf.call(0), 0);
  });
});
