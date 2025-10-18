import { Router } from "express";
const router = Router();
import firebaseAuth from "../middleware/firebaseAuth";

router.get("/", (req, res) => {
  res.json({ message: "List of all properties." });
});

router.post("/", firebaseAuth, (req, res) => {
  res.status(201).json({ message: "New property created." });
});

router.post("/:id/invest", firebaseAuth, (req, res) => {
  const { id } = req.params;
  res.json({ message: `Successfully invested in property ${id}.` });
});

router.post("/:id/rent", firebaseAuth, (req, res) => {
  const { id } = req.params;
  res.json({ message: `Successfully rented property ${id}.` });
});

module.exports = router;
