import * as dotenv from "dotenv";
import { Client, PrivateKey, TopicCreateTransaction } from "@hashgraph/sdk";

dotenv.config();

async function createTopic() {
 

// 1. Get credentials
const accountId = process.env.MY_ACCOUNT_ID;
const privateKeyString = process.env.MY_PRIVATE_KEY;

// 2. *** CHANGE THIS LINE ***
// Use the specific ECDSA function as the warning suggests
const operatorKey = PrivateKey.fromStringECDSA(privateKeyString); 

// 3. Set up the client and operator
const client = Client.forTestnet();
client.setOperator(accountId, operatorKey);

    try {
        // ... rest of your transaction code ...
        const transaction = new TopicCreateTransaction();
        const txResponse = await transaction.execute(client);
        const receipt = await txResponse.getReceipt(client);
        
        console.log(`\nNew Topic ID: ${receipt.topicId.toString()}`);

    } catch (err) {
        console.error("\nERROR: Error creating topic:", err.message);
    }
}

createTopic();