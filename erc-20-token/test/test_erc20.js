const Moycoin = artifacts.require("Moycoin");
import expectThrow from "openzeppelin-solidity/test/helpers/expectThrow.js";

contract("Moycoin", async (accounts) => {
  let coin;

  beforeEach(async () => {
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

  it("allows owner to transfers tokens", async () => {
    const res1 = await coin.transfer(accounts[1], 100);
    const res2 = await coin.transfer(accounts[2], 1000);
    const res3 = await coin.transfer(accounts[2], 10, {from: accounts[1]});
    assert.equal(await coin.balanceOf.call(accounts[0]), 122356);
    assert.equal(await coin.balanceOf.call(accounts[1]), 90);
    assert.equal(await coin.balanceOf.call(accounts[2]), 1010);

    assert.equal(res1.logs.length, 1);
    assertEqualEvent(res1.logs[0], {
      event: "Transfer",
      args: {from: accounts[0], to: accounts[1], value: 100}
    });

    assert.equal(res2.logs.length, 1);
    assertEqualEvent(res2.logs[0], {
      event: "Transfer",
      args: {from: accounts[0], to: accounts[2], value: 1000}
    });

    assert.equal(res3.logs.length, 1);
    assertEqualEvent(res3.logs[0], {
      event: "Transfer",
      args: {from: accounts[1], to: accounts[2], value: 10}
    });
  });

  it("prohibits transfer leading to negative balance", async () => {
    await expectThrow(coin.transfer(accounts[1], 123457));
    await expectThrow(coin.transfer(accounts[0], 1, {from: accounts[1]}));

    await coin.transfer(accounts[1], 10);
    await expectThrow(coin.transfer(accounts[1], 123447));
    await expectThrow(coin.transfer(accounts[0], 11, {from: accounts[1]}));

    await coin.transfer(accounts[0], 10, {from: accounts[1]});
    await coin.transfer(accounts[1], 123456);
  });
});

const assertEqualEvent = function(haystack, needle) {
  assert.equal(haystack.event, needle.event);
  for (var key in Object.keys(haystack.args).concat(Object.keys(needle.args))) {
    assert.equal(haystack.args[key], needle.args[key]);
  }
}
