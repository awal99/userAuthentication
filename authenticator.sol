// SPDX-License-Identifier: GPL-3.0

/**@dev @audit - '^' is still a floating pragma, consider using a fixed version like '0.8.18'.
 * Only use floating pragmas when writing libraries or developer tools / contracts that need to support multiple compiler versions.
 */
pragma solidity ^0.8.18;

/**
 * @dev it is good practice to use named imports where you specify the actual content you want to import.
 * example - import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
 * Makes it easier to track imports and debug errors.
 */

import "@openzeppelin/contracts/access/Ownable.sol";

contract UserManagement is Ownable {
    enum UserRole {
        None,
        User,
        Admin
    }

    /**
     * @dev - Not a great idea to store strings on-chain. Strings are expensive to store and manipulate on-chain and also expose users information to the public.
     * Users emails and usernames are stored in the clear on-chain, which is a security risk, best to use a much secure method of storing this information.
     * @audit - Consider using a bytes32 instead of a string to store the username and email. This will save on gas costs and prevent users information from being exposed.
     * @dev DONE

     *@audit - Acknowledged fix.
     */
    struct User {
        bytes32 username;
        bytes32 email;
        bytes32 encryptedPassword;
        UserRole role;
    }

    /**
     * @dev - Would not recommend using strings as keys in a mapping.
     * The use of strings is not recommended in general, as they are expensive to store and manipulate on-chain.
     * It is cheaper to use bytes32 or uint256 as keys. Better still the user's address can be used as the key.
     * @dev DONE

     * @dev @audit - Acknowledged change of mapping keys.
     */
    mapping(address => User) public users;
    mapping(address => bool) public usernameExists; ///@dev @audit - Either use the bytes32 of the email as key or completely remove this mapping and utilize the users mapping instead.
    mapping(bytes32 => bool) public emailExists;

    event UserSignedUp(
        address indexed userAddress,
        bytes32 username,
        bytes32 email,
        UserRole role
    );
    event UserRoleUpdated(address indexed userAddress, UserRole role);

    modifier onlyAdmin() {
        require(
            users[msg.sender].role == UserRole.Admin,
            "Only admin can call this function"
        );
        _;
    }

    /**
     * @dev @audit userExists modifier can be bypassed by users who sign up with an empty string as their username.
     */
    modifier userExists() {
        require(
            bytes32(users[msg.sender].username).length > 0,
            "User does not exist"
        );
        _;
    }

    /**
     * @dev it is worth noting, naming of variables and functions differ based on the visibility.
     * For example, using underscores for private and internal variables/functinos and camelCase for public variables unless otherwise.
     * This is not a requirement but a good practice to follow.
     * @dev DONE

     * @dev @audit - Users could signup with empty strings as their username, email and password. 
     * Might be worth adding a check to ensure these values are not empty or resrict registrations to authorized addresses.
     */
    function signUp(
        bytes32 username,
        bytes32 email,
        bytes32 encryptedPassword
    ) external {
        /**@audit as noted on line 44, a different user can still use a username already used by another address */
        require(!usernameExists[msg.sender], "Username already taken");
        require(!emailExists[email], "Email already registered");

        User memory newUser = User({
            username: username,
            email: email,
            encryptedPassword: encryptedPassword,
            role: UserRole.User
        });

        ///@audit Users mapping will be overwritten if the same address is used to sign up multiple times with different usernames and emails.
        ///@audit - Consider using the user's address as the key instead of the username, this will prevent users from signing up multiple times with the same address
        ///@dev - Alternatively, the address can be tied to the user's username and email in the frontend thereby only requiring a hashed password to be stored on-chain.
        ///@dev DONE

        ///@audit It's still possible for a user to overwrite their own information by signing up with a different username and email.
        ///@dev - This can be prevented by adding a check to to the users mapping to ensure the username and email are not already registered.

        users[msg.sender] = newUser;
        usernameExists[msg.sender] = true;
        emailExists[email] = true;

        emit UserSignedUp(msg.sender, username, email, UserRole.User);
    }

    function login(
        bytes32 _email,
        bytes32 _encryptedPassword
    ) external view returns (bytes32) {
        require(emailExists[_email], "Email not registered");

        ///@audit gas optimization - Load the user into memory instead of storage since we are not modifying the user.
        ///@dev - This will save on gas costs as it is cheaper to work with memory than storage.
        ///@dev DONE
        ///@audit - Acknowledged fix.

        User memory user = users[msg.sender];

        ///@dev careful using encodePacked, it can lead to collisions. Be sure to use a salt or nonce to prevent possible collisions.
        require(
            keccak256(abi.encodePacked(_encryptedPassword)) ==
                user.encryptedPassword,
            "Incorrect password"
        );

        return user.username;
    }

    ///@dev - This function is uncallable because no admin is ever initialized in this contract.
    ///@dev - Best to unclude that in the constructor or utlize openzeppelin's access control or ownable contracts.
    ///!@dev @audit - NOT FIXED
    function updateUserRole(
        address _userAddress,
        UserRole _role
    ) external onlyAdmin {
        require(
            users[_userAddress].role != UserRole.None,
            "User does not exist"
        );

        users[_userAddress].role = _role;

        emit UserRoleUpdated(_userAddress, _role);
    }

    /// @dev - This getter function should accept an address as an argument and return the user's role instead of the msg.sender's role.
    /// @dev - Ensure to pass that address to the userExists modifier to ensure the user exists.
    /// @dev DONE
    /// @dev @audit - Acknowledged fix.
    function getUserRole(
        address userAddress
    ) external view userExists returns (UserRole) {
        return users[userAddress].role;
    }
}
