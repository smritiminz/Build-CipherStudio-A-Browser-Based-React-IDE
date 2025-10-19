require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// =======================
// ✅ MIDDLEWARE
// =======================
app.use(cors({ origin: 'http://localhost:5173' })); // allow frontend
app.use(express.json()); // parse JSON bodies

// =======================
// ✅ CONNECT TO MONGODB
// =======================
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// =======================
// 📘 SNIPPET MODEL
// =======================
const SnippetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, default: "javascript" },
  createdAt: { type: Date, default: Date.now },
});

const Snippet = mongoose.model("Snippet", SnippetSchema);

// =======================
// 📡 ROUTES
// =======================

// 🌍 Root route
app.get('/', (req, res) => {
  res.send('🔐 CipherStudio Backend is Running!');
});

// 🌐 Ping route (test backend)
app.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

// 🧾 Fetch all snippets
app.get('/api/snippets', async (req, res) => {
  try {
    const snippets = await Snippet.find().sort({ createdAt: -1 });
    res.json({ success: true, data: snippets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ➕ Create new snippet
app.post('/api/snippets', async (req, res) => {
  try {
    const { title, code, language } = req.body;
    if (!title || !code)
      return res.status(400).json({ success: false, error: "Title and code are required" });

    const snippet = new Snippet({ title, code, language });
    const saved = await snippet.save();
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✏️ Update snippet
app.put('/api/snippets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, code, language } = req.body;

    const updated = await Snippet.findByIdAndUpdate(
      id,
      { title, code, language },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, error: "Snippet not found" });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ❌ Delete snippet
app.delete('/api/snippets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Snippet.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ success: false, error: "Snippet not found" });

    res.json({ success: true, data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =======================
// 🚀 START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
