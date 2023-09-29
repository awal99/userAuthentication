import { expect } from 'chai';
import { ethers } from 'hardhat';
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe('UserManagement', async () => {

    async function deployment() {        
        const [admin, alice, bob] = await ethers.getSigners();

        const UserManagement = await ethers.getContractFactory('UserManagement')
        const userManagement = await UserManagement.connect(admin).deploy();
        return { userManagement, admin, alice, bob }
    }

    function prepareSignUpData(email: string, username: string, password: string) {
        const passwordBytes = ethers.encodeBytes32String(password)
        const emailBytes = ethers.encodeBytes32String(email)
        const usernameBytes = ethers.encodeBytes32String(username)
        const hashedPassword = ethers.keccak256(passwordBytes)

        return {emailBytes, usernameBytes, hashedPassword}
    }

    function prepareLoginData(password: string) {
        return ethers.keccak256(ethers.encodeBytes32String(password))
    }

    describe('Deployment', () => {
        it('should deploy with the right owner', async () => {
            const { userManagement, admin } = await loadFixture(deployment);
        
            expect(await userManagement.owner()).to.equal(admin.address); 
        })
        
    })

    describe('Signup', () => {
        it('should not signup a user if caller not admin', async () => {
            const { userManagement, alice } = await loadFixture(deployment);

            const { emailBytes, usernameBytes, hashedPassword } = prepareSignUpData('alice@example.com', 'alice', 'AlicePasswd2000')
            ///@notice alice tries to send the transaction, not owner.
            await expect(userManagement.connect(alice).signUp(usernameBytes, emailBytes, hashedPassword, alice.address)).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('should not signup with invalid input', async () => {
            const { userManagement, alice } = await loadFixture(deployment);
            await expect(userManagement.signUp(ethers.encodeBytes32String(""), ethers.encodeBytes32String(""), ethers.encodeBytes32String(""), alice.address)).to.be.revertedWith("Invalid input")

        })

        it('should not sign up a user more than once', async () => {
            const { userManagement, alice } = await loadFixture(deployment);
            const { emailBytes, usernameBytes, hashedPassword } = prepareSignUpData('alice@example.com', 'alice', 'AlicePasswd2000')
            await userManagement.signUp(usernameBytes, emailBytes, hashedPassword, alice.address) ///@notice first sign up

            const { emailBytes: emailBytes2, usernameBytes: usernameBytes2, hashedPassword: hashedPassword2 } = prepareSignUpData('sample2@example.com', 'alice_2', 'AlicePasswd2002')
            await expect(userManagement.signUp(usernameBytes2, emailBytes2, hashedPassword2, alice.address)).to.be.revertedWith('user already registered')
        })

        it('should not allow duplicate usernames', async () => {
            const { userManagement, alice, bob } = await loadFixture(deployment);
            const { emailBytes, usernameBytes, hashedPassword } = prepareSignUpData('alice@example.com', 'alice', 'AlicePasswd2000')
            await userManagement.signUp(usernameBytes, emailBytes, hashedPassword, alice.address) ///@notice first sign up
            
            ///@notice reusing Alice's username
            const { emailBytes: emailBytes2, usernameBytes: usernameBytes2, hashedPassword: hashedPassword2 } = prepareSignUpData('bob@example.com', 'alice', 'BobPasswd2002')
            await expect(userManagement.signUp(usernameBytes2, emailBytes2, hashedPassword2, bob.address)).to.be.revertedWith('username unavailable')
        })

        it('should not allow duplicate emails', async () => {
            const { userManagement, alice, bob } = await loadFixture(deployment);
            const { emailBytes, usernameBytes, hashedPassword } = prepareSignUpData('alice@example.com', 'alice', 'AlicePasswd2000')
            await userManagement.signUp(usernameBytes, emailBytes, hashedPassword, alice.address) ///@notice first sign up
            
            ///@notice reusing Alice's email
            const { emailBytes: emailBytes2, usernameBytes: usernameBytes2, hashedPassword: hashedPassword2 } = prepareSignUpData('alice@example.com', 'bob', 'BobPasswd2002')
            await expect(userManagement.signUp(usernameBytes2, emailBytes2, hashedPassword2, bob.address)).to.be.revertedWith('Email already registered')
        })

        it('should sign users up', async () => {
            const { userManagement, alice, bob } = await loadFixture(deployment);
            const { emailBytes, usernameBytes, hashedPassword } = prepareSignUpData('alice@example.com', 'alice', 'AlicePasswd2000')
            await userManagement.signUp(usernameBytes, emailBytes, hashedPassword, alice.address) ///@notice Alice's sign up

            const aliceDetails = await userManagement.users(alice.address)
            expect(aliceDetails.username).to.equal(usernameBytes, 'Alice username mismatch')
            expect(aliceDetails.email).to.equal(emailBytes, 'Alice email mismatch')
            expect(aliceDetails.encryptedPassword).to.equal(hashedPassword, 'Alice password hash mismatch')
            expect(aliceDetails.role).to.equal(1n, 'Alice role should be user(1)');
         
            const { emailBytes: emailBytes2, usernameBytes: usernameBytes2, hashedPassword: hashedPassword2 } = prepareSignUpData('bob@example.com', 'bob', 'BobPasswd2002')
            await userManagement.signUp(usernameBytes2, emailBytes2, hashedPassword2, bob.address) ///@notice Bob's sign up

            const bobDetails = await userManagement.users(alice.address)
            expect(bobDetails.username).to.equal(usernameBytes, 'Bob username mismatch')
            expect(bobDetails.email).to.equal(emailBytes, 'Bob email mismatch')
            expect(bobDetails.encryptedPassword).to.equal(hashedPassword, 'Bob password hash mismatch')
            expect(bobDetails.role).to.equal(1n, 'Bob role should be user(1)');
        })
    })

    describe('Login', () => {
        it('should not login if user has not signed up', async () => {
            const { userManagement, alice } = await loadFixture(deployment);
            const hashedPassword = prepareLoginData('AlicePasswd2000')

            await expect(userManagement.login(hashedPassword, alice.address)).to.be.rejectedWith('User does not exist')
        })

        it('should not login if caller not admin', async () => {
            const { userManagement, alice } = await loadFixture(deployment);
            const hashedPassword = prepareLoginData('AlicePasswd2000')
            ///@notice alice is trying to make the contract call
            await expect(userManagement.connect(alice).login(hashedPassword, alice.address)).to.be.rejectedWith('Ownable: caller is not the owner')
        })

        it('should not login if wrong password used', async () => {
            const { userManagement, alice } = await loadFixture(deployment);
            const { emailBytes, usernameBytes, hashedPassword } = prepareSignUpData('alice@example.com', 'alice', 'AlicePasswd2000')
            await userManagement.signUp(usernameBytes, emailBytes, hashedPassword, alice.address) ///@notice alice signed up

            const wrongPassword = prepareLoginData('AlicePasswd2000 ') ///@notice whitespace in password

            await expect(userManagement.login(wrongPassword, alice.address)).to.be.rejectedWith('Incorrect password')
        })
        
        it('should login user', async () => {
            const { userManagement, alice } = await loadFixture(deployment);
            const { emailBytes, usernameBytes, hashedPassword } = prepareSignUpData('alice@example.com', 'alice', 'AlicePasswd2000')
            await userManagement.signUp(usernameBytes, emailBytes, hashedPassword, alice.address) ///@notice alice signed up

            const returnedData = await userManagement.login(hashedPassword, alice.address);

            expect(returnedData).to.equal(usernameBytes, 'Invalid username returned')
            expect(ethers.decodeBytes32String(returnedData)).to.equal('alice', 'decoded username mismatch')
        })
    })

    describe('Update user role', () => {
        it('should not change user role if caller not admin', async () => {
            const { userManagement, alice } = await loadFixture(deployment);
            await expect(userManagement.connect(alice).updateUserRole(alice.address, 2)).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('should not changer user role if not signed up', async () => {
            const { userManagement, alice } = await loadFixture(deployment);
            await expect(userManagement.updateUserRole(alice.address, 2)).to.be.revertedWith('User does not exist')
        })

        it('should change user role', async () => {
            const { userManagement, alice } = await loadFixture(deployment);
            const { emailBytes, usernameBytes, hashedPassword } = prepareSignUpData('alice@example.com', 'alice', 'AlicePasswd2000')
            await userManagement.signUp(usernameBytes, emailBytes, hashedPassword, alice.address) ///@notice alice signed up
            
            await userManagement.updateUserRole(alice.address, 2)

            const aliceDetails = await userManagement.users(alice.address)
            expect(aliceDetails.role).to.equal(2n, 'Alice role should be admin(2)');
        })
    })

    describe('Get user Role', () => {
        it('should get user role', async () => {
            const { userManagement, alice, bob } = await loadFixture(deployment);
            const aliceRole = await userManagement.getUserRole(alice.address);
            expect(aliceRole).to.equal(0n)


            const { emailBytes, usernameBytes, hashedPassword } = prepareSignUpData('bob@example.com', 'bob', 'BobPasswd2000')
            await userManagement.signUp(usernameBytes, emailBytes, hashedPassword, bob.address) ///@notice alice signed up

            const bobRole = await userManagement.getUserRole(bob.address);
            expect(bobRole).to.equal(1n)
        })
    })
})