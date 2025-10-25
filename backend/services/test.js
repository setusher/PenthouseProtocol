// This file is used to test the functionality of hederaService.js
// You must have a .env file configured with:
// HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, USDC_TOKEN_ID

// We use dotenv to load environment variables from the .env file
import dotenv from "dotenv";
dotenv.config();


// Fix: The original hederaService.js was missing imports and a constant.
// We need to define them here for local testing, or better yet, update the service file itself.
// Since you provided the service file and it's being used as a module, 
// let's ensure the necessary imports are done *inside* the service file
// (as I did in my previous reply), and assume that file is now correctly configured.
// For this test script, we only need to import the final module exports.

// Assuming hederaService.js is now fully updated and self-contained:
const {
  createPropertyToken,
  getTreasuryTokenBalance,
  client,
} = require("/home/ameya/Desktop/PenthouseProtocol/backend/services/hederaService.js"); // Adjust path if needed

/**
 * Step 1: Create a new Property Token
 */
async function createTokenTest() {
  console.log("--- Starting Hedera Service Tests ---");
  let tokenId = null;

  try {
    const tokenName = "Test Property Share";
    const tokenSymbol = "TPS";
    const initialSupply = 5000; // Total shares for the property

    console.log(`\n1. Attempting to create token: ${tokenName} (${tokenSymbol}) with supply ${initialSupply}...`);

    // --- EXECUTE THE FUNCTION TO BE TESTED ---
    tokenId = await createPropertyToken(
      tokenName,
      tokenSymbol,
      initialSupply
    );
    // ----------------------------------------

    console.log(`✅ Token Creation Successful! New Token ID: ${tokenId}`);

    // Proceed to Step 2: Verification of the Treasury Balance
    await verifyBalanceTest(tokenId, initialSupply);

  } catch (error) {
    console.error("❌ Token Creation FAILED:", error.message);
    if (error.status) {
        // Log status from Hedera SDK error objects
        console.error("   Hedera Status:", error.status.toString());
    }
  } finally {
    // Crucial step: close the client connection after testing is complete
    if (client) {
      client.close();
      console.log("\n--- Hedera client closed. Test sequence finished. ---");
    }
  }

  return tokenId;
}

/**
 * Step 2: Verify the Treasury Balance using the Mirror Node
 */
async function verifyBalanceTest(tokenId, expectedBalance) {
    console.log(`\n2. Attempting to verify treasury balance for Token ID: ${tokenId}...`);

    // Give the transaction a few seconds to propagate to the Mirror Node (optional but safer)
    await new Promise(resolve => setTimeout(resolve, 5000)); 

    // --- EXECUTE THE FUNCTION TO BE TESTED ---
    const actualBalance = await getTreasuryTokenBalance(tokenId);
    // ----------------------------------------

    if (actualBalance === expectedBalance) {
        console.log(`✅ Balance Verification Successful!`);
        console.log(`   Expected: ${expectedBalance} | Actual: ${actualBalance}`);
    } else {
        console.error(`❌ Balance Verification FAILED.`);
        console.error(`   Expected: ${expectedBalance} | Actual: ${actualBalance}`);
        console.log(`   (Note: Mirror node latency can sometimes cause delays. Try running again.)`);
    }
}

// Start the test sequence
createTokenTest();
