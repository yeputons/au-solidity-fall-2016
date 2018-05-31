pragma solidity ^0.4.21;

import "./SocialConnection.sol";

contract SocialAccount {
    string public name;
    address public owner;

    event NameChanged(SocialAccount indexed account, string oldName, string newName);

    // Stores following connections:
    // 1. Initiated by me (owns such connections)
    // 2. Accepted by me
    // 3. Cancelled
    mapping(address => SocialConnection) public connections;

    constructor(string _name) public {
        name = _name;
        owner = msg.sender;
    }

    function setName(string _name) public {
        require(msg.sender == owner);
        emit NameChanged(this, name, _name);
        name = _name;
    }

    // `connection` is zero if we want to create a new `SocialConnection`
    // and non-zero otherwise. This prevents frontrunning: user always knows
    // what `SocialConnection` they accept and can check its code.
    function addFriend(SocialAccount other, SocialConnection connection) public {
        require(msg.sender == owner);
        // There is neither pending request, nor accepted request.
        require(getFriendConnection(other) == SocialConnection(0));
        if (connection == SocialConnection(0)) {
            connections[other] = new SocialConnection(other);
        } else {
            // Ensure that the connection still exists and double-check.
            require(connection.initiator() == other);
            require(connection.acceptor() == this);
            connections[other] = connection;
            connection.accept();
        }
    }

    function getFriendConnection(SocialAccount other) internal returns (SocialConnection) {
        if (connections[other] != SocialConnection(0) && connections[other].status() == SocialConnection.Status.CANCELLED) {
            delete connections[other];
        }
        return connections[other];
    }

    // Unsafe as it doesn't check type of the proposed `SocialConnection`.
    // It may be unknown in advance because of either malicious `SocialAccount`
    // on the other end or frontrunning.
    function addFriendWithAnyConnection(SocialAccount other) external {
        SocialConnection conn = other.connections(this);
        if (conn != SocialConnection(0) && conn.status() == SocialConnection.Status.CANCELLED) {
            conn = SocialConnection(0);
        }
        addFriend(other, conn);
    }

    function removeFriend(SocialAccount other) external {
        require(msg.sender == owner);
        SocialConnection conn = connections[other];
        if (conn == SocialConnection(0)) {
            return;
        }
        conn.cancel();  // We assume that SocialConnection is safe.
        delete connections[other];

        // Do not notify the other contract as it's extra external call and may be unsafe.
    }
}
