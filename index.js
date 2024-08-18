const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://radiant-da151.web.app"],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tvtcgta.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // ----------------------------------------------------------------
    // --------------------DB collection---------------------------
    // ----------------------------------------------------------------

    const userCollection = client.db("radiantDB").collection("allUser");
    const productCollection = client.db("radiantDB").collection("allProduct");
    const ratingCollection = client.db("radiantDB").collection("allRating");

    // ----------------------------------------------------------------
    // --------------------user related route---------------------------
    // ----------------------------------------------------------------

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      // console.log(email);
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.put("/edit/:id", async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = { $set: updateUser };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // ----------------------------------------------------------------
    // --------------------product related route---------------------------
    // ----------------------------------------------------------------

    app.post("/addProduct", async (req, res) => {
      const addNewProduct = req.body;
      const result = await productCollection.insertOne(addNewProduct);
      res.send(result);
    });
    app.get("/productsCount", async (req, res) => {
      const count = await productCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page) - 1;
      const size = parseInt(req.query.size);
      const filter = req.query.filter || "";
      const search = req.query.search || "";
      const sort = req.query.sort || "";

      let query = {};
      if (filter) {
        query.category = filter;
      }
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }

      let sortOrder = {};
      if (sort === "low") {
        sortOrder.price = 1;
      } else if (sort === "high") {
        sortOrder.price = -1;
      } else if (sort === "newest") {
        sortOrder.createdAt = -1;
      }

      const result = await productCollection
        .find(query)
        .sort(sortOrder)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.get("/my-product/:email", async (req, res) => {
      const result = await productCollection
        .find({ email: req.params.email })
        .toArray();
      res.send(result);
    });

    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedProduct = req.body;

      const product = {
        $set: {
          name: updatedProduct.name,
          category: updatedProduct.category,
          description: updatedProduct.description,
          image: updatedProduct.image,
          brand: updatedProduct.brand,
          price: updatedProduct.price,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        product,
        options
      );
      res.send(result);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      res.send(result);
    });
    // ----------------------------------------------------------------
    // --------------------rating related route---------------------------
    // ----------------------------------------------------------------

    app.get("/rating", async (req, res) => {
      const result = await ratingCollection.find().toArray();
      res.send(result);
    });

    app.post("/rating", async (req, res) => {
      const addNewRating = req.body;
      const result = await ratingCollection.insertOne(addNewRating);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`Ser Ser Server is running on port: ${port}`);
});
