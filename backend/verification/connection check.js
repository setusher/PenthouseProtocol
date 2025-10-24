import { Client, AccountBalanceQuery } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

const client = Client.forTestnet();
client.setOperator(process.env.MY_ACCOUNT_ID, process.env.MY_PRIVATE_KEY);

const balance = await new AccountBalanceQuery()
  .setAccountId(process.env.MY_ACCOUNT_ID)
  .execute(client);

console.log(" Connected successfully!");
console.log(" Balance:", balance.hbars.toString());
