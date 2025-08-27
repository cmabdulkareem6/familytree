import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: "https://familytree-steel-mu.vercel.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// MongoDB connection function with retry
const connectWithRetry = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://familytree:familyuser@cluster0.htdn3zc.mongodb.net/familyTree",
      { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
      }
    );
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Retrying in 5 seconds...");
    setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
  }
};

// Call the connection function
connectWithRetry();

// Reconnect if disconnected (after sleep)
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Reconnecting...");
  connectWithRetry();
});

// Schemas
const memberSchema = new mongoose.Schema({
  name: String,
  spouses: [String],
  children: [Object],
});

const treeSchema = new mongoose.Schema({
  father: String,
  mother: String,
  children: [memberSchema],
});

const FamilyTree = mongoose.model("FamilyTree", treeSchema);

// Helper: get or create tree
const getOrCreateTree = async () => {
  let doc = await FamilyTree.findOne();
  if (!doc) {
    doc = new FamilyTree({ father: "", mother: "", children: [] });
    await doc.save();
  }
  return doc;
};

// Routes
app.get("/family-tree", async (req, res) => {
  try {
    const doc = await getOrCreateTree();
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tree" });
  }
});

app.post("/update-family-tree", async (req, res) => {
  try {
    await FamilyTree.deleteMany({});
    const newTree = new FamilyTree(req.body);
    await newTree.save();
    res.json(newTree);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update tree" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
