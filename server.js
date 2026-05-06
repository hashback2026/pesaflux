const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const formatPhone = (phone) => {
  phone = phone.trim();
  if (phone.startsWith("0")) return "254" + phone.slice(1);
  if (phone.startsWith("+254")) return phone.slice(1);
  return phone;
};

app.post("/send-bulk", async (req, res) => {
  const { numbers, amount, reference } = req.body;

  if (!numbers || !amount) {
    return res.status(400).json({ error: "Missing data" });
  }

  const list = numbers.split(/[\s,]+/);
  const results = [];

  for (let num of list) {
    const msisdn = formatPhone(num);

    try {
      const response = await axios.post(
        "https://api.pesaflux.co.ke/v1/initiatestk",
        {
          api_key: process.env.API_KEY,
          email: process.env.EMAIL,
          amount: Number(amount),
          msisdn,
          reference: reference || "bulk_payment"
        }
      );

      results.push({
        phone: msisdn,
        status: "success",
        data: response.data
      });

    } catch (err) {
      results.push({
        phone: msisdn,
        status: "failed",
        error: err.response?.data || err.message
      });
    }

    await delay(2000);
  }

  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
