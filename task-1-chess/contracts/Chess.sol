pragma solidity ^0.4.0;

contract Chess {
    address public white;
    address public black;
    bool public whitesTurnNext;
    bytes32[] public turns;
    
    constructor(address white_, address black_) public {
        white = white_;
        black = black_;
        whitesTurnNext = true;
    }

    function turnsCount() public view returns (uint) {
        return turns.length;
    }
    
    function makeTurn(bytes32 turn) public {
        if (whitesTurnNext) {
            require(msg.sender == white);
        } else {
            require(msg.sender == black);
        }
        whitesTurnNext = !whitesTurnNext;
        turns.push(turn);
    }
}