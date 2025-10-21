const { Router } = require("express");
const router = Router();
const firebaseAuth = require("../middleware/firebaseAuth");
const { db } = require("../services/firebaseService.js");
const { FieldValue } = require("firebase-admin/firestore");

const {
  createPropertyToken,
  transferTokens,
  getTreasuryTokenBalance,
  verifyUsdcPayment,
} = require("../services/hederaService");

const USDC_DECIMALS = 6;

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
      return res.status(403).json({ error: "KYC verification required." });
    }

    const propRef = db.collection("properties").doc(propertyId);
    const propDoc = await propRef.get();
    if (!propDoc.exists) {
      return res.status(404).json({ error: "Property not found." });
    }
    const { hederaTokenId, pricePerToken } = propDoc.data();

    const expectedUsdcAmountSmallestUnit = Math.round(
      amount * pricePerToken * 10 ** USDC_DECIMALS
    );
    let paymentTxId;
    try {
      paymentTxId = await verifyUsdcPayment(
        db,
        userHederaAccountId,
        expectedUsdcAmountSmallestUnit,
        "investment",
        propertyId
      );
    } catch (paymentError) {
      return res.status(402).json({
        error: `Payment verification failed: ${paymentError.message}`,
      });
    }

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
      return res.status(500).json({
        error:
          "Token transfer failed after payment verified. Please contact support.",
      });
    }

    await propRef.update({
      escrowBalance: FieldValue.increment(amount * pricePerToken),
    });

    res.json({
      message: `Successfully invested in property ${propertyId}. ${amount} tokens transferred.`,
      paymentTxId: paymentTxId,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to process investment." });
  }
});

router.post("/:id/rent", firebaseAuth, async (req, res) => {
  try {
    const { id: propertyId } = req.params;
    const { leaseStartDate, leaseEndDate, userHederaAccountId } = req.body;
    const renterUserId = req.uid;

    const userDoc = await db.collection("users").doc(renterUserId).get();
    if (!userDoc.exists || !userDoc.data().isKycVerified) {
      return res.status(403).json({ error: "KYC verification required." });
    }

    const propRef = db.collection("properties").doc(propertyId);
    const propDoc = await propRef.get();
    if (!propDoc.exists) {
      return res.status(404).json({ error: "Property not found." });
    }
    const { rentalPrice, status: propertyStatus } = propDoc.data();

    if (propertyStatus !== "available") {
      return res
        .status(409)
        .json({ error: "This property is already rented." });
    }

    const expectedUsdcAmountSmallestUnit = Math.round(
      rentalPrice * 10 ** USDC_DECIMALS
    );
    let paymentTxId;
    try {
      paymentTxId = await verifyUsdcPayment(
        db,
        userHederaAccountId,
        expectedUsdcAmountSmallestUnit,
        "rent",
        propertyId
      );
    } catch (paymentError) {
      return res.status(402).json({
        error: `Rent payment verification failed: ${paymentError.message}`,
      });
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
      firstPaymentTxId: paymentTxId,
      paymentVerified: true,
      createdAt: new Date(),
    });

    await propRef.update({
      escrowBalance: FieldValue.increment(rentalPrice),
    });

    res.json({
      message: `Successfully rented property ${propertyId}. Payment verified.`,
      paymentTxId: paymentTxId,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to rent property." });
  }
});

module.exports = router;
