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

  it("starts with zero allowances", async () => {
    assert.equal(await coin.allowance.call(accounts[0], accounts[0]), 0);
    assert.equal(await coin.allowance.call(accounts[0], accounts[1]), 0);
    assert.equal(await coin.allowance.call(accounts[1], accounts[1]), 0);
    assert.equal(await coin.allowance.call(accounts[1], accounts[2]), 0);
  });

  it("overrides allowance", async () => {
    let res1 = await coin.approve(accounts[1], 100);
    let res2 = await coin.approve(accounts[2], 10, {from: accounts[1]});
    let res3 = await coin.approve(accounts[1], 50);
    assert.equal(await coin.allowance.call(accounts[0], accounts[0]), 0);
    assert.equal(await coin.allowance.call(accounts[0], accounts[1]), 50);
    assert.equal(await coin.allowance.call(accounts[1], accounts[0]), 0);
    assert.equal(await coin.allowance.call(accounts[1], accounts[1]), 0);
    assert.equal(await coin.allowance.call(accounts[1], accounts[2]), 10);
    assert.equal(await coin.allowance.call(accounts[2], accounts[1]), 0);

    assert.equal(res1.logs.length, 1);
    assertEqualEvent(res1.logs[0], {
      event: "Approval",
      args: {owner: accounts[0], spender: accounts[1], value: 100},
    });

    assert.equal(res2.logs.length, 1);
    assertEqualEvent(res2.logs[0], {
      event: "Approval",
      args: {owner: accounts[1], spender: accounts[2], value: 10},
    });

    assert.equal(res3.logs.length, 1);
    assertEqualEvent(res3.logs[0], {
      event: "Approval",
      args: {owner: accounts[0], spender: accounts[1], value: 50},
    });
  });

  it("allows transferFrom", async () => {
    await coin.approve(accounts[1], 100);
    let res1 = await coin.transferFrom(accounts[0], accounts[2], 30, {from: accounts[1]});
    let res2 = await coin.transferFrom(accounts[0], accounts[3], 60, {from: accounts[1]});
    assert.equal(await coin.balanceOf.call(accounts[0]), 123366);
    assert.equal(await coin.balanceOf.call(accounts[1]), 0);
    assert.equal(await coin.balanceOf.call(accounts[2]), 30);
    assert.equal(await coin.balanceOf.call(accounts[3]), 60);
    assert.equal(await coin.allowance.call(accounts[0], accounts[1]), 10);

    assert.equal(res1.logs.length, 1);
    assertEqualEvent(res1.logs[0], {
      event: "Transfer",
      args: {from: accounts[0], to: accounts[2], value: 30}
    });

    assert.equal(res2.logs.length, 1);
    assertEqualEvent(res2.logs[0], {
      event: "Transfer",
      args: {from: accounts[0], to: accounts[3], value: 60}
    });
  });

  it("disallows transferFrom when allowance is depleted", async () => {
    await coin.approve(accounts[1], 100);
    await coin.transferFrom(accounts[0], accounts[2], 30, {from: accounts[1]});
    await expectThrow(coin.transferFrom(accounts[2], accounts[0], 1, {from: accounts[2]}));
    await expectThrow(coin.transferFrom(accounts[2], accounts[0], 1, {from: accounts[1]}));
    await expectThrow(coin.transferFrom(accounts[2], accounts[0], 1, {from: accounts[0]}));
    await expectThrow(coin.transferFrom(accounts[0], accounts[3], 80, {from: accounts[1]}));
    await coin.transferFrom(accounts[0], accounts[3], 70, {from: accounts[1]});
    assert.equal(await coin.balanceOf.call(accounts[0]), 123356);
    assert.equal(await coin.balanceOf.call(accounts[1]), 0);
    assert.equal(await coin.balanceOf.call(accounts[2]), 30);
    assert.equal(await coin.balanceOf.call(accounts[3]), 70);
    assert.equal(await coin.allowance.call(accounts[0], accounts[1]), 0);
  });

  it("disallows transferFrom when there are not enough funds", async () => {
    await coin.transfer(accounts[1], 100);
    await coin.approve(accounts[2], 200, {from: accounts[1]});

    await coin.transferFrom(accounts[1], accounts[3], 90, {from: accounts[2]});

    await expectThrow(coin.transferFrom(accounts[1], accounts[3], 15, {from: accounts[2]}));
    assert.equal(await coin.allowance.call(accounts[1], accounts[2]), 110);

    await coin.transferFrom(accounts[1], accounts[3], 10, {from: accounts[2]});
    assert.equal(await coin.allowance.call(accounts[1], accounts[2]), 100);

    assert.equal(await coin.balanceOf.call(accounts[0]), 123356);
    assert.equal(await coin.balanceOf.call(accounts[1]), 0);
    assert.equal(await coin.balanceOf.call(accounts[2]), 0);
    assert.equal(await coin.balanceOf.call(accounts[3]), 100);
  });
});

const assertEqualEvent = function(haystack, needle) {
  assert.equal(haystack.event, needle.event);
  for (var key in Object.keys(haystack.args).concat(Object.keys(needle.args))) {
    assert.equal(haystack.args[key], needle.args[key]);
  }
}
