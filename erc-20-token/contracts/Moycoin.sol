pragma solidity ^0.4.21;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

contract Moycoin is DetailedERC20("Moycoin", "MOY", 1) {
    uint256 public initialSupply;
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) internal allowances;

    constructor(uint256 _initialSupply) public {
        initialSupply = _initialSupply;
        balances[msg.sender] = initialSupply;
    }

    function totalSupply() public view returns (uint256) {
        return initialSupply;
    }

    function balanceOf(address who) public view returns (uint256) {
        return balances[who];
    }

    function transfer(address to, uint256 value) public returns (bool success) {
        require(balances[msg.sender] >= value);
        balances[msg.sender] -= value;
        balances[to] += value;  // No overflow as totalSupply fits in uint256
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(allowances[from][msg.sender] >= value);
        require(balances[from] >= value);
        allowances[msg.sender][from] -= value;
        balances[from] -= value;
        balances[to] += value;  // No overflow as totalSupply fits in uint256
        emit Transfer(from, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool success) {
        allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256 remaining) {
        return allowances[owner][spender];
    }
}
