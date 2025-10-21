const { AccountId, PrivateKey, Client } = require("@hashgraph/sdk");
const axios = require("axios");

const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
const MIRROR_NODE_URL = "https://testnet.mirrornode.hedera.com";
const USDC_TOKEN_ID = process.env.USDC_TOKEN_ID;

export async function createPropertyToken(
  tokenName,
  tokenSymbol,
  initialSupply
) {
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

    const data = response.data;
    const tokens = data.tokens;

    if (tokens && tokens.length > 0) {
      const tokenInfo = tokens[0];
      const balance = parseInt(tokenInfo.balance, 10);
      return balance;
    } else {
      return 0;
    }
  } catch (error) {
    console.error(
      `Error fetching token balance for ${tokenId} from mirror node:`,
      error.message
    );
    if (error.response) {
      console.error("API Response Status:", error.response.status);
      console.error("API Response Data:", error.response.data);
    }
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
  } catch (err) {
    throw new Error(
      `Could not connect to mirror node to verify ${paymentType} USDC payment.`
    );
  }

  const transactions = response.data.transactions;
  if (!transactions || transactions.length === 0) {
    throw new Error(
      `${
        paymentType.charAt(0).toUpperCase() + paymentType.slice(1)
      } USDC payment not found. Please wait a few moments and try again.`
    );
  }

  let validTxId = null;
  for (const tx of transactions) {
    const senderTransfer = tx.token_transfers.find(
      (transfer) =>
        transfer.account === senderAccountId &&
        transfer.amount === -expectedAmount
    );
    const treasuryTransfer = tx.token_transfers.find(
      (transfer) =>
        transfer.account === TREASURY_ACCOUNT_ID &&
        transfer.amount === expectedAmount
    );

    if (senderTransfer && treasuryTransfer) {
      const txRef = db
        .collection("processedTransactions")
        .doc(tx.transaction_id);
      const txDoc = await txRef.get();

      if (txDoc.exists) {
        continue; // Keep looking for a newer, unused one
      }

      // Found a new, valid payment!
      validTxId = tx.transaction_id;
      break;
    }
  }

  if (!validTxId) {
    throw new Error(
      `Valid ${paymentType} USDC payment not found. Make sure you sent the exact amount from the correct account.`
    );
  }

  await db.collection("processedTransactions").doc(validTxId).set({
    processedAt: new Date(),
    sender: senderAccountId,
    amount: expectedAmount,
    type: "USDC",
    purpose: paymentType,
    propertyId: propertyId,
    verified: true,
  });
  return validTxId;
}
