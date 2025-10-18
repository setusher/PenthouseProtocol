import { AccountId, PrivateKey, Client } from "@hashgraph/sdk";

const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function createPropertyToken(tokenName, tokenSymbol, initialSupply) {
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

async function transferTokens(tokenId, amount, userAccountId) {
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
