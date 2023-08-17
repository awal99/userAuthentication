import "@nomiclabs/hardhat-ethers"
import { ethers, network } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

async function main() {

  const [deployer] = await ethers.getSigners();
  console.log(
  "Deploying contracts with the account:",
  deployer.address
  );

 //console.log("Account balance:", (await signer).toString());

  const authenticator = await ethers.getContractFactory("UserManagement");
  const contract = await authenticator.deploy();

  console.log("Contract deployed at:", contract?.address);
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});