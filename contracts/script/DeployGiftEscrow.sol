// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GiftEscrow.sol";

/**
 * Deploy script — no Script contract needed for the contract logic itself.
 * Pass --private-key on the CLI; no need for PRIVATE_KEY in .env.
 *
 * Usage (Base Sepolia):
 *   forge script script/DeployGiftEscrow.sol \
 *     --rpc-url https://sepolia.base.org \
 *     --private-key <YOUR_PRIVATE_KEY> \
 *     --broadcast -vvvv
 *
 * Usage (Base Mainnet):
 *   forge script script/DeployGiftEscrow.sol \
 *     --rpc-url https://mainnet.base.org \
 *     --private-key <YOUR_PRIVATE_KEY> \
 *     --broadcast -vvvv
 *
 * Alternatively, use forge create (even simpler — no Script contract at all):
 *   forge create src/GiftEscrow.sol:GiftEscrow \
 *     --rpc-url https://sepolia.base.org \
 *     --private-key <YOUR_PRIVATE_KEY>
 */
contract DeployGiftEscrow is Script {
    function run() external {
        // vm.startBroadcast() with no args uses --private-key from the CLI.
        // No need to store your private key in environment variables.
        vm.startBroadcast();

        GiftEscrow escrow = new GiftEscrow();

        vm.stopBroadcast();

        console.log("=================================================");
        console.log("GiftEscrow deployed at:", address(escrow));
        console.log("Update ESCROW_CONTRACT_ADDRESS in client/src/lib/wagmi.ts");
        console.log("=================================================");
    }
}
