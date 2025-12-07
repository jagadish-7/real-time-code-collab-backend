const mongoose = require('mongoose');

// Subdocument schema for code snippets
const CodeSnippetSchema = new mongoose.Schema({
  language: { type: String, required: true },
  code: { type: String, required: true }
});


const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inviteLink: { type: String, required: true },
  expiryDate: { type: Date },
  importance: { type: String, required: true },
  description: { type: String, required: true },
  canEdit: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  codeSnippets: { type: [CodeSnippetSchema], default: [] },
  chatMessages: [{ user: String, message: String, timestamp: Date }],
  whiteboardContent: { type: String, default: '' },
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  connectedUsers: [{ userId: mongoose.Schema.Types.ObjectId, name: String }],
  submittedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userFirstName: { type: String },
    userLastName: { type: String }
  }],
  submitted: { type: Boolean, default: false }, // New field
});

module.exports = mongoose.model('Task', taskSchema);
