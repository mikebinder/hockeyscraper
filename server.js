// Dependencies
var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

// Require Note and Article models
var Note = require("./models/note.js");
var Article = require("./models/article.js");

// Scraping Tools
var request = require("request");
var cheerio = require("cheerio");

// Setting mongoose to leverage built in Javascript ES6 promises
mongoose.Promise = Promise;

// Initial Express
var app = express();

// Using morgan and body parser with app
// app.use(logger("dev"));
app.use(bodyParser.urlencoded({
	extended: false
}));

// Handlebars engine to call up the main handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Make views a static directory
app.use(express.static("views"));

// Database configuration with mongoose

mongoose.connect("mongodb://localhost/mikescraper");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
	console.log("Mongoose Error: ", error);
});

// Once, logged in to the db through mongoose, log a success message
db.once("open", function() {
	console.log("Mongoose connection successful");
});

// Routes
app.get("/", function(req, res) {
	res.render("articles");
});

// A GET request to scrape the website
app.get("/scrape", function(req, res) {
	
	// First, grab the body of the html with request
	request("http://www.headlinehockey.com/", function(error, response, html) {

		var $ = cheerio.load(html);
		
		$("li").each(function(i, element) {
			
				// Save an empty result object
				var result = {};

				
				result.title = $(this).children("a").text();
				result.link = $(this).children("a").attr("href");

				
				var entry = new Article(result);

				entry.save(function(err, doc) {
					// Log any errors
					if(err) {
						console.log(err);
					}
					// Or log the doc
					else {
						console.log(doc);
					}
				});

			// end of if statement

		}); // end of function
	});
	console.log("Scrape complete");
	res.redirect("/articles");
});

// This will get the articles we scraped from the mongoDB onto page /articles
app.get("/articles", function(req, res) {
	// Grab every doc in the Articles array
	Article.find({}, function(error, doc) {
		// Log any errors
		if(error) {
			console.log(error);
		}
		// Or send the doc to the browser as a json object
		else {
			res.render("articles", {
				articles: doc
			});
			// res.json(doc);
		}
	});
	
});

// Get route to display Saved Articles
app.get("/savedarticles", function(req, res) {
	// Finds articles where saved is true
	Article.find({"saved" : true}, function(err, doc) {
		if (err) {
			console.log(err);
		}
		else {
			// Render savedarticles handlebars
			res.render("saved-articles", {
				articles: doc
			});
		}
	});
});


// Grab an article by it's ObjectId id parameter :id
app.get("/articles/:id", function(req, res) {
	// Using the id passed in the id parameter, prepare a query that find the matching one in our db
	Article.findOne({ "_id": req.params.id })
	// And, populate all the notes associated with it
	.populate("note")
	// Now, execute the query
	.exec(function(error, doc) {
		// Log any errors
		if (error) {
			console.log(error);
		}
		// Otherwise, send the doc to the browser as a json object
		else {
			// res.json(doc);
			res.render("note", {
				article: doc
			});
		}
	});
});


// Post (create) a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
	// Create a new note and pass the req.body to the entry
	var newNote = new Note(req.body);
	// And save the new note the db
	newNote.save(function(error, doc) {
		// Log any errors
		if (error) {
			console.log(error);
		}
		// Otherwise
		else {
			var articleId = req.params.id;
			// Use the article id to find and update the note
			Article.findOneAndUpdate({ "_id": articleId }, { "note": doc._id })
			// Execute the above query
			.exec(function(err, doc) {
				// Log errors
				if (err) {
					console.log(err);
				}
				else {
					res.redirect("/articles/" + articleId);
					// res.send(doc);
				}
			});
		}
	});
});	

// // Post Route to delete a note 
app.post("/articles/:aId/delete/:nId", function(req, res) {
	var articleId = req.params.aId;
	var noteId = req.params.nId;
	// Method in mongoose that searches for the id in the url, pulls the notes with the note id in the url
	Article.update({"_id": articleId}, {"note": noteId}, {"multi": false}, function(err, res) {
		if (err) {
			console.log(err);
		}
		else {
			Note.remove({"_id": noteId}, function(err, res) {
				if (err) {
					console.log(err);
				}
				else {
					console.log("Note deleted");
				}
			});
		}
	});
	res.redirect("/articles/" + articleId);
});

// Set route to update an article to SAVED = true if user clicks "save article"
app.post("/savedarticles/:id", function(req, res) {
	Article.update({ "_id" : req.params.id }, { "saved" : true }, function(err, res) {
		if (err) {
			console.log(err);
		}
		else {
			console.log(res);
		}
	});
	res.redirect("/savedarticles");
});

// Unsave articles
app.post("/unsavedarticles/:id", function(req, res) {
	// Update article with parameter _id by setting parameter saved to false
	Article.update( { "_id" : req.params.id }, { "saved" : false }, function(err, res) {
		if (err) {
			console.log(err);
		}
		else {
			console.log(res);
		}
	});
	res.redirect("/savedarticles");
});

const PORT = process.env.PORT || 3001


app.listen(PORT, function() {
	console.log("App running");
});