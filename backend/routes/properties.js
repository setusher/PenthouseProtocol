const { Router } = require("express");
const router = Router();
const firebaseAuth = require("../middleware/firebaseAuth");
import { db } from "../services/firebaseService.js";
const { FieldValue } = require("firebase-admin/firestore");

const {
  createPropertyToken,
  transferTokens,
  getTreasuryTokenBalance,
} = require("../services/hederaService");

router.get("/", async (req, res) => {
  try {
    const properties = [];
    const snapshot = await db.collection("properties").get();

    snapshot.forEach((doc) => {
      properties.push({ id: doc.id, ...doc.data() });
    });

    res.json(properties);
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch properties from database." });
  }
});

router.post("/", firebaseAuth, async (req, res) => {
  try {
    const {
      propertyName,
      symbol,
      initialSupply,
      description,
      imageUrl,
      rentalPrice, // Price per month to RENT
      pricePerToken, // Price per token to INVEST
      ownerHederaAccountId,
    } = req.body;

    const ownerUserId = req.uid;

    const tokenId = await createPropertyToken(
      propertyName,
      symbol,
      initialSupply
    );

    const newProperty = {
      ownerUserId,
      ownerHederaAccountId,
      hederaTokenId: tokenId,
      name: propertyName,
      symbol,
      description,
      imageUrl,
      rentalPrice,
      pricePerToken,
      totalTokenSupply: initialSupply,
      status: "available",
      escrowBalance: 0,
      createdAt: new Date(),
    };

    const docRef = await db.collection("properties").add(newProperty);

    res.status(201).json({
      message: "Property listed and token created successfully!",
      propertyId: docRef.id,
      tokenId: tokenId,
    });
  } catch (error) {
    console.error("Property creation failed:", error);
    res.status(500).json({ error: "Failed to create property and token." });
  }
});

router.post("/:id/invest", firebaseAuth, async (req, res) => {
  try {
    const { id: propertyId } = req.params;
    const { amount, userHederaAccountId } = req.body;
    const investorUserId = req.uid;

    const userDoc = await db.collection("users").doc(investorUserId).get();
    if (!userDoc.exists || !userDoc.data().isKycVerified) {
      return res.status(403).json({
        error:
          "KYC verification required. Please complete the mock KYC step in the app.",
      });
    }

    const propRef = db.collection("properties").doc(propertyId);
    const propDoc = await propRef.get();

    if (!propDoc.exists) {
      return res.status(404).json({ error: "Property not found." });
    }

    const { hederaTokenId, pricePerToken } = propDoc.data();
    const onChainBalance = await getTreasuryTokenBalance(hederaTokenId);

    if (amount > onChainBalance) {
      return res.status(409).json({
        error: `Not enough tokens available. Only ${onChainBalance} remaining.`,
      });
    }

    const success = await transferTokens(
      hederaTokenId,
      amount,
      userHederaAccountId
    );

    if (!success) {
      throw new Error(
        "Hedera token transfer transaction failed. The tokens may have just been sold."
      );
    }

    const paymentAmount = amount * pricePerToken;
    await propRef.update({
      escrowBalance: FieldValue.increment(paymentAmount),
    });

    res.json({
      message: `Successfully invested in property ${propertyId}. ${amount} tokens transferred.`,
      paymentReceived: paymentAmount,
    });
  } catch (error) {
    console.error(`Investment in ${req.params.id} failed:`, error.message);
    res.status(500).json({ error: "Failed to process investment." });
  }
});

router.post("/:id/rent", firebaseAuth, async (req, res) => {
  try {
    const { id: propertyId } = req.params;
    const { leaseStartDate, leaseEndDate } = req.body;
    const renterUserId = req.uid;

    const userDoc = await db.collection("users").doc(renterUserId).get();
    if (!userDoc.exists || !userDoc.data().isKycVerified) {
      return res.status(403).json({
        error:
          "KYC verification required. Please complete the mock KYC step in the app.",
      });
    }

    const propRef = db.collection("properties").doc(propertyId);
    const propDoc = await propRef.get();

    if (!propDoc.exists) {
      return res.status(404).json({ error: "Property not found." });
    }
    if (propDoc.data().status !== "available") {
      return res
        .status(409)
        .json({ error: "This property is already rented." });
    }

    await propRef.update({
      status: "rented",
      currentTenantId: renterUserId,
    });

    await db.collection("leases").add({
      propertyId: propertyId,
      tenantUserId: renterUserId,
      leaseStartDate: new Date(leaseStartDate),
      leaseEndDate: new Date(leaseEndDate),
      createdAt: new Date(),
    });

    res.json({ message: `Successfully rented property ${propertyId}.` });
  } catch (error) {
    console.error(`Renting property ${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to rent property." });
  }
});

module.exports = router;
