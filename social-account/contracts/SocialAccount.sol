pragma solidity ^0.4.21;

contract SocialAccount {
    string public name;
    address public owner;

    constructor(string _name) public {
        name = _name;
        owner = msg.sender;
    }

    function setName(string _name) public {
        require(msg.sender == owner);
        name = _name;
    }
}
