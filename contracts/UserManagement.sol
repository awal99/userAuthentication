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
    mapping(address user => bool used) userNameExists;
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
            bytes32(users[userAddress].username).length > 0,
            "User does not exist"
        );
        _;
    }

    function signUp(
        bytes32 username,
        bytes32 email,
        bytes32 encryptedPassword
    ) external {
        require(
            users[msg.sender].username.length == 0 &&
                users[msg.sender].email.length == 0,
            "user already registered"
        );
        require(!emailExists[email], "Email already registered");
        require(!userNameExists[msg.sender], "username unavailable");

        User memory newUser = User({
            username: username,
            email: email,
            encryptedPassword: encryptedPassword,
            role: UserRole.User
        });

        users[msg.sender] = newUser;
        emailExists[email] = true;
        userNameExists[msg.sender] = true;

        emit UserSignedUp(msg.sender, username, email, UserRole.User);
    }

    function login(
        bytes32 _email,
        bytes32 _encryptedPassword
    ) external view returns (bytes32) {
        require(emailExists[_email], "Email not registered");
        require(users[msg.sender].username.length != 0, "User not registered");

        User memory user = users[msg.sender];

        require(
            _encryptedPassword == user.encryptedPassword,
            "Incorrect password"
        );

        return user.username;
    }

    function updateUserRole(
        address _userAddress,
        UserRole _role
    ) external onlyOwner {
        require(
            users[_userAddress].role != UserRole.None,
            "User does not exist"
        );

        users[_userAddress].role = _role;

        emit UserRoleUpdated(_userAddress, _role);
    }

    function getUserRole(
        address userAddress
    ) external view userExists(userAddress) returns (UserRole) {
        return users[userAddress].role;
    }
}
