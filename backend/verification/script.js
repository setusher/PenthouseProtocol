import fs from "fs";


const properties = JSON.parse(fs.readFileSync("/home/ameya/Desktop/PenthouseProtocol/properties.json", "utf-8"));

import dotenv from "dotenv";
dotenv.config();
import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";

// Hedera client setup using ECDSA key
const accountId = process.env.MY_ACCOUNT_ID;
const privateKeyString = process.env.MY_PRIVATE_KEY;



// Use the specific ECDSA function
const operatorKey = PrivateKey.fromStringECDSA(privateKeyString);

const client = Client.forTestnet();
client.setOperator(accountId, operatorKey);



// 🔹 Verify property–owner pair locally
function verifyOwnership(propertyId, ownerId) {
  const property = properties.find(p => p.id === propertyId);
  if (!property) return { verified: false, reason: "Property not found" };
  if (property.Owner_ID !== ownerId)
    return { verified: false, reason: "Owner ID does not match" };
  return { verified: true, reason: "Verified successfully" };
}


// 🔹 Record verification result on Hedera
async function recordVerification(propertyId, ownerId) {
  const topicId = process.env.TOPIC_ID;
  const result = verifyOwnership(propertyId, ownerId);

  if (!result.verified) {
    console.error(`Verification failed for Property ID ${propertyId}: ${result.reason}`);
    return;
  }

  const message = JSON.stringify({
    property_id: propertyId,
    owner_id: ownerId,
    verified: true,
    timestamp: new Date().toISOString(),
  });

  try {
    const tx = await new TopicMessageSubmitTransaction({ topicId, message }).execute(client);
    console.log(" On-chain verification successful!");
    console.log(" Transaction ID:", tx.transactionId.toString());
    console.log(" Message logged to topic:", topicId);
  } catch (err) {
   console.error(" Failed to submit transaction:", err);
  }
}
// ▶ Example run
(async () => {
  await recordVerification("2", "67890");
})();
