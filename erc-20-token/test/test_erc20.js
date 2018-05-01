const Moycoin = artifacts.require("Moycoin");

contract("Moycoin", async () => {
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
});
