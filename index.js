const express = require("express");
const axios = require('axios');
require("dotenv").config();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());

const mongoURI = process.env.MONGO_URL;

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

const transactionSchema = new mongoose.Schema({
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  sold: Boolean,
  dateOfSale: String,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

const fetchAndInsert = async () => {
  try {
    await mongoose.connect(mongoURI); 

    const response = await axios.get(
      'https://s3.amazonaws.com/roxiler.com/product_transaction.json'
    );
    const data = response.data;

    for (let item of data) {
      const existingTransaction = await Transaction.findOne({ id: item.id });

      if (!existingTransaction) {
        const newTransaction = new Transaction({
          id: item.id,
          title: item.title,
          price: item.price,
          description: item.description,
          category: item.category,
          image: item.image,
          sold: item.sold,
          dateOfSale: item.dateOfSale,
        });

        await newTransaction.save();
      }
    }

    console.log('Transactions added successfully');
  } catch (error) {
    console.error('Error fetching or inserting data:', error);
  } finally {
    await mongoose.connection.close();
  }
};




app.get("/", (request, response) => {
    response.send("Hello World");
  });



  app.get("/alltransactions/", async (request, response) => {
    try {
      const searchQuery = request.query.search;
    
      let filter = {};
  
      if (searchQuery) {
        const priceRange = searchQuery.match(/price:(\d+)-(\d+)/); 
        if (priceRange) {
          const minPrice = parseInt(priceRange[1]);
          const maxPrice = parseInt(priceRange[2]);
          filter = {
            $or: [
              { title: { $regex: new RegExp(searchQuery, 'i') } },
              { description: { $regex: new RegExp(searchQuery, 'i') } },
              { price: { $gte: minPrice, $lte: maxPrice } },
            ],
          };
        } else {
      
          filter = {
            $or: [
              { title: { $regex: new RegExp(searchQuery, 'i') } },
              { description: { $regex: new RegExp(searchQuery, 'i') } },
            ],
          };
        }
      }

      const transactions = await Transaction.find(filter);
      response.send(transactions);
    } catch (err) {
      console.error(err);
      response.status(500).send("Server Error");
    }
  });
  
  

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));


