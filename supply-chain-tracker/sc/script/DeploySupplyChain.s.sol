// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

/**
 * @title DeploySupplyChain
 * @notice Script to deploy the SupplyChain contract
 * @dev Usage: forge script script/DeploySupplyChain.s.sol:DeploySupplyChain --rpc-url <RPC_URL> --broadcast
 */
contract DeploySupplyChain is Script {
    function run() external returns (SupplyChain) {
        // Get the deployer's private key from environment or use default for local testing
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the contract
        SupplyChain supplyChain = new SupplyChain();
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Log deployment info
        console.log("==============================================");
        console.log("SupplyChain Contract Deployed!");
        console.log("==============================================");
        console.log("Contract Address:", address(supplyChain));
        console.log("Admin Address:", supplyChain.admin());
        console.log("==============================================");
        console.log("");
        console.log("IMPORTANT: Copy these values to your frontend config:");
        console.log("- CONTRACT_ADDRESS:", address(supplyChain));
        console.log("- ADMIN_ADDRESS:", supplyChain.admin());
        console.log("==============================================");
        
        return supplyChain;
    }
}

