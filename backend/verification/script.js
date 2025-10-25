import dotenv from "dotenv";
dotenv.config();
import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { client } from "../services/hederaService.js";

function verifyOwnership(propertyId, ownerId) {
  const property = properties.find((p) => p.id === propertyId);
  if (!property) return { verified: false, reason: "Property not found" };
  if (property.Owner_ID !== ownerId)
    return { verified: false, reason: "Owner ID does not match" };
  return { verified: true, reason: "Verified successfully" };
}

async function recordVerification(propertyId, ownerId) {
  const topicId = process.env.TOPIC_ID;
  const result = verifyOwnership(propertyId, ownerId);

  if (!result.verified) {
    console.error(
      `Verification failed for Property ID ${propertyId}: ${result.reason}`
    );
    return result;
  }

  const message = JSON.stringify({
    property_id: propertyId,
    owner_id: ownerId,
    verified: true,
    timestamp: new Date().toISOString(),
  });

  try {
    const tx = await new TopicMessageSubmitTransaction({
      topicId,
      message,
    }).execute(client);
    console.log(" On-chain verification successful!");
    console.log(" Transaction ID:", tx.transactionId.toString());
    console.log(" Message logged to topic:", topicId);
  } catch (err) {
    console.error(" Failed to submit transaction:", err);
  }
  return result;
}

export { recordVerification };
