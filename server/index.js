import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors({ origin: "http://localhost:5173", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json());

// MongoDB connection
await mongoose
  .connect("mongodb://127.0.0.1:27017/familytree", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schema definitions
const memberSchema = new mongoose.Schema({
  name: String,
  spouses: [String],
  children: [Object], // allow nested structure
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
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
