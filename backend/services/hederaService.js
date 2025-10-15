import { AccountId, PrivateKey, Client } from "@hashgraph/sdk";

async function main() {
    let client;
    try {
        const ACC_ID = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
        const PRIVATE_KEY = PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY);

        client = Client.forTestnet()
        client.setOperator(ACC_ID, PRIVATE_KEY)
    } catch (e) {
        console.error(e);
    } finally {
        if (client) client.close();
    }
}

main();
