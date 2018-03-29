// Require Mongoose
var mongoose = require("mongoose");

// Create a schema class
var Schema = mongoose.Schema;

// Create the Note Schema
var NoteSchema = new Schema({
	// A string
	title: {
		type: String
	},
	// A string
	body: {
		type: String
	}	
});

// Mongoose will automatically save the ObjectIds of the noteSchema
// Ids are referred to in the Article Model

// Create the Note model with the NoteSchema
var Note = mongoose.model("Note", NoteSchema);

// Export the Note model
module.exports = Note;