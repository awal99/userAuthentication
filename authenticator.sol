// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract UserManagement {
    enum UserRole { None, User, Admin }

    struct User {
        string username;
        string email;
        bytes32 encryptedPassword;
        UserRole role;
    }

    mapping(address => User) public users;
    mapping(string => bool) public usernameExists;
    mapping(string => bool) public emailExists;

    event UserSignedUp(address indexed userAddress, string username, string email, UserRole role);
    event UserRoleUpdated(address indexed userAddress, UserRole role);

    modifier onlyAdmin() {
        require(users[msg.sender].role == UserRole.Admin, "Only admin can call this function");
        _;
    }

    modifier userExists() {
        require(bytes(users[msg.sender].username).length > 0, "User does not exist");
        _;
    }

    function signUp(string memory _username, string memory _email, bytes32 _encryptedPassword) external {
        require(!usernameExists[_username], "Username already taken");
        require(!emailExists[_email], "Email already registered");

        User memory newUser = User({
            username: _username,
            email: _email,
            encryptedPassword: _encryptedPassword,
            role: UserRole.User
        });

        users[msg.sender] = newUser;
        usernameExists[_username] = true;
        emailExists[_email] = true;

        emit UserSignedUp(msg.sender, _username, _email, UserRole.User);
    }

    function login(string memory _email, bytes32 _encryptedPassword) external view returns (string memory) {
        require(emailExists[_email], "Email not registered");

        User storage user = users[msg.sender];
        require(keccak256(abi.encodePacked(_encryptedPassword)) == user.encryptedPassword, "Incorrect password");

        return user.username;
    }

    function updateUserRole(address _userAddress, UserRole _role) external onlyAdmin {
        require(users[_userAddress].role != UserRole.None, "User does not exist");

        users[_userAddress].role = _role;

        emit UserRoleUpdated(_userAddress, _role);
    }

    function getUserRole() external view userExists returns (UserRole) {
        return users[msg.sender].role;
    }
}
