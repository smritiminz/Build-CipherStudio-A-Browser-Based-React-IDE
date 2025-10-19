const mongoose = require("mongoose");

// ✅ Define Snippet Schema
const SnippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Snippet title is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Code content is required"],
    },
    language: {
      type: String,
      default: "javascript",
      enum: ["javascript", "python", "java", "c++", "html", "css", "typescript"],
    },
  },
  {
    timestamps: true, // ✅ Adds createdAt & updatedAt automatically
  }
);

// ✅ Export model
module.exports = mongoose.model("Snippet", SnippetSchema);
