import {generateSalt, sha256WithSalt} from './encrypt'

//roles are hashed using SHA-256 for better security
const roles={
    admin:'dd174b0ea8875653c4452102d5e229c0a119542f88c4aa930144e64e735da3ae',
    user:'8773ffcf67cea857be3da0781f749afb85cfb0c1af5389f381afe6f9867896db',
}

function main(){
    signUp();
    logIn()
}

function signUp(){
    //generate hash and salt
    const password = 'your_password_here';
    const salt = generateSalt();
    const hashedPassword = sha256WithSalt(password, salt);

    console.log('Salt:', salt);
    console.log('Hashed Password:', hashedPassword);

    //store hashedpassword + signup data to block-chain
    

    //return salt to user/thirdparty as public key
    //it depends on the user/thirdparty as to how to store salt as public key
}

function logIn(){

    //provide user private key (password)
    const password = ''
    //get user's salt
    const salt = ''
    //create a hash of the user's password and salt
    const hashedPassword = sha256WithSalt(password, salt);
    //check hash against data on the blockchain

}



main()
//encryptPassword();