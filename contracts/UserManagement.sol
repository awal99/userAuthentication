// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.21;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract UserManagement is Ownable2Step {
    enum UserRole {
        None,
        User,
        Admin
    }

    struct User {
        bytes32 username;
        bytes32 email;
        bytes32 encryptedPassword;
        UserRole role;
    }

    mapping(address user => User userStruct) public users;
    mapping(bytes32 username => bool used) userNameExists;
    mapping(bytes32 email => bool used) public emailExists;

    event UserSignedUp(
        address indexed userAddress,
        bytes32 username,
        bytes32 email,
        UserRole role
    );
    event UserRoleUpdated(address indexed userAddress, UserRole role);

    modifier userExists(address userAddress) {
        require(
            (users[userAddress].username) != bytes32(0),
            "User does not exist"
        );
        _;
    }

    function signUp(
        bytes32 username,
        bytes32 email,
        bytes32 encryptedPassword,
        address userAddress
    ) external onlyOwner {
        require(
            users[userAddress].username == bytes32(0) &&
                users[userAddress].email == bytes32(0),
            "user already registered"
        );
        require(!emailExists[email], "Email already registered");
        require(!userNameExists[username], "username unavailable");
        require(
            username != bytes32(0) ||
                email != bytes32(0) ||
                encryptedPassword != bytes32(0),
            "Invalid input"
        );

        User memory newUser = User({
            username: username,
            email: email,
            encryptedPassword: encryptedPassword,
            role: UserRole.User
        });

        users[userAddress] = newUser;
        emailExists[email] = true;
        userNameExists[username] = true;

        emit UserSignedUp(userAddress, username, email, UserRole.User);
    }

    function login(
        bytes32 encryptedPassword,
        address userAddress
    ) external view onlyOwner userExists(userAddress) returns (bytes32) {
        User memory user = users[userAddress];

        require(
            encryptedPassword == user.encryptedPassword,
            "Incorrect password"
        );

        return user.username;
    }

    function updateUserRole(
        address userAddress,
        UserRole role
    ) external onlyOwner userExists(userAddress) {
        users[userAddress].role = role;

        emit UserRoleUpdated(userAddress, role);
    }

    function getUserRole(address userAddress) external view returns (UserRole) {
        return users[userAddress].role;
    }
}
