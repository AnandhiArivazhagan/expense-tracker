const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Money = require("./model/money");

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb+srv://Anandhi:anandhi_2005@cluster0.favzmu6.mongodb.net/expenseDB?appName=Cluster0")
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.log(err));

/* ===========================
   GET ALL EXPENSES
=========================== */
app.get("/expenses", async (req, res) => {
  const expenses = await Money.find();
  res.json(expenses);
});

/* ===========================
   ADD EXPENSE
=========================== */
app.post("/expenses", async (req, res) => {
  const newExpense = new Money(req.body);
  await newExpense.save();
  res.json(newExpense);
});

/* ===========================
   UPDATE EXPENSE
=========================== */
app.put("/expenses/:id", async (req, res) => {
  const updated = await Money.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

/* ===========================
   DELETE EXPENSE
=========================== */
app.delete("/expenses/:id", async (req, res) => {
  await Money.findByIdAndDelete(req.params.id);
  res.json({ message: "Expense deleted" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));