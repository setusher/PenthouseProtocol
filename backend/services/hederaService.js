import {
  AccountId,
  PrivateKey,
  Client,
  TokenCreateTransaction,
  TokenType,
  TransferTransaction,
} from "@hashgraph/sdk";
import axios from "axios";

const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const MIRROR_NODE_URL = "https://testnet.mirrornode.hedera.com";
const USDC_TOKEN_ID = process.env.USDC_TOKEN_ID;
const TREASURY_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID;

export async function createPropertyToken(tokenName, tokenSymbol, initialSupply) {
  const createTx = await new TokenCreateTransaction()
    .setTokenName(tokenName)
    .setTokenSymbol(tokenSymbol)
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(0)
    .setInitialSupply(initialSupply)
    .setTreasuryAccountId(operatorId)
    .setAdminKey(operatorKey)
    .setSupplyKey(operatorKey)
    .freezeWith(client);

  const signedTx = await createTx.sign(operatorKey);
  const txResponse = await signedTx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const tokenId = receipt.tokenId;

  console.log(`Property token created: ${tokenId.toString()}`);
  return tokenId.toString();
}

export async function transferTokens(tokenId, amount, userAccountId) {
  try {
    const transferTx = await new TransferTransaction()
      .addTokenTransfer(tokenId, operatorId, -amount)
      .addTokenTransfer(tokenId, userAccountId, amount)
      .freezeWith(client);

    const signedTransferTx = await transferTx.sign(operatorKey);
    const transferTxResponse = await signedTransferTx.execute(client);
    const transferReceipt = await transferTxResponse.getReceipt(client);

    return transferReceipt.status.toString() === "SUCCESS";
  } catch (error) {
    console.error("Error transferring tokens:", error);
    return false;
  }
}

export async function getTreasuryTokenBalance(tokenId) {
  if (!tokenId) {
    console.error("tokenId parameter is required for getTreasuryTokenBalance.");
    return 0;
  }

  const apiUrl = `${MIRROR_NODE_URL}/api/v1/accounts/${operatorId}/tokens?token.id=${tokenId}`;

  try {
    const response = await axios.get(apiUrl);
    const tokens = response.data.tokens;

    if (tokens && tokens.length > 0) {
      const tokenInfo = tokens[0];
      const balance = parseInt(tokenInfo.balance, 10);
      return balance;
    } else {
      return 0;
    }
  } catch (error) {
    console.error(`Error fetching token balance:`, error.message);
    return 0;
  }
}

export async function verifyUsdcPayment(
  db,
  senderAccountId,
  expectedAmount,
  paymentType = "unknown",
  propertyId = null
) {
  const url = `${MIRROR_NODE_URL}/api/v1/transactions?account.id=${operatorId}&token.id=${USDC_TOKEN_ID}&transactiontype=CRYPTOTRANSFER&result=success&limit=10&order=desc`;

  let response;
  try {
    response = await axios.get(url);
  } catch {
    throw new Error(`Could not connect to mirror node to verify ${paymentType} USDC payment.`);
  }

  const transactions = response.data.transactions;
  if (!transactions || transactions.length === 0) {
    throw new Error(`No ${paymentType} USDC payment found.`);
  }

  let validTxId = null;
  for (const tx of transactions) {
    const senderTransfer = tx.token_transfers.find(
      (t) => t.account === senderAccountId && t.amount === -expectedAmount
    );
    const treasuryTransfer = tx.token_transfers.find(
      (t) => t.account === TREASURY_ACCOUNT_ID && t.amount === expectedAmount
    );

    if (senderTransfer && treasuryTransfer) {
      const txRef = db.collection("processedTransactions").doc(tx.transaction_id);
      const txDoc = await txRef.get();

      if (!txDoc.exists) {
        validTxId = tx.transaction_id;
        break;
      }
    }
  }

  if (!validTxId) {
    throw new Error(`Valid ${paymentType} USDC payment not found.`);
  }

  await db.collection("processedTransactions").doc(validTxId).set({
    processedAt: new Date(),
    sender: senderAccountId,
    amount: expectedAmount,
    type: "USDC",
    purpose: paymentType,
    propertyId,
    verified: true,
  });

  return validTxId;
}

export { client };

// Example direct call (optional test)
createPropertyToken("Lodalasun", "L", 100);
