import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";


const Private_Key:String = "0x744c990abf317c9e08c5ca42f267a61d13c3b6736f6a2357dababe1c98d66f81"

const config: HardhatUserConfig = {
  solidity: "0.8.21",
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545", // Ganache default URL
      gas: "auto", // Or specify gas limit
      gasPrice: "auto", // Or specify gas price
      accounts: [`${Private_Key}`], // Number of available accounts
    },
    hardhat: {
    }
  }
};



export default config;