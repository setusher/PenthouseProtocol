import express from "express";
import dotenv from "dotenv";
import cors from "cors";


dotenv.config();

const app = express();


app.use(express.json());
app.use(cors());


import ownerRoutes from "./routes/owner.js";
import investorRoutes from "./routes/investor.js";
import tenantRoutes from "./routes/tenant.js";
import settlementRoutes from "./routes/settlement.js";


app.use("/owner", ownerRoutes);
app.use("/investor", investorRoutes);
app.use("/tenant", tenantRoutes);
app.use("/settlement", settlementRoutes);


app.get("/", (req, res) => {
  res.send("🏡 HomeChain backend is running successfully!");
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
