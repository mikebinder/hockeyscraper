// Require Mongoose
var mongoose = require("mongoose");

// Create Schema class
var Schema = mongoose.Schema;

// Create article Schema
var ArticleSchema = new Schema({
	
	title: {
		type: String,
		required: true,
		unique: true
	},
	
	link: {
		type: String,
		required: true,
		unique: true
	},
	// This only saves one note's ObjectId, ref refers to the Note model
	note: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Note"
		}],
	saved: {
		type: Boolean,
		default: false 
	}
});

// Create the Article model with the ArticleSchema
var Article = mongoose.model("Article", ArticleSchema);

// Export the model
module.exports = Article;

