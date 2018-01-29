//Set up dependencies
const express = require("express");
const mongojs = require("mongojs");
const bodyParser = require("body-parser");
const logger = require("morgan");

//Scraper tools
const request = require("request");
const cheerio = require("cheerio");

//Requiring Note and Article models
// const Note = require("./models/Note")

//Initialize Express
const app = express();

// Set the app up with morgan, body-parser, and a static folder
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static("public"));

//Database configuration 
const databaseUrl = "lfcDB";
const collections = ["lfcNews"]

//Connect mongojs configuration to the db variable
const db = mongojs(databaseUrl, collections);
db.on("error", (error) => { console.log("Database Error: ", error);
});

//Main route
app.get("/", (req, res) => {res.send(index.html);
});

//Retrieve data from the DB
app.get("/saved", function(req,res){
	//Find all results from the lfcNews collection in the db
	db.lfcNews.find({}, function(error, found){
		//If there is an error
		if (error) {
			console.log(error);
		}
		//If successful, send the data to the browser as json
		else{
			res.json(found);
		}
	});
});

// Scrape data from one site and place it into the mongodb 
app.get("/scrape", function(req, res){
	//Make a request for the first team news section of liverpool fc
	request("http://www.liverpoolfc.com/news/first-team", function(error, response, html){
		// Load the html body from request into cheerio
		const $ = cheerio.load(html);
		// For each element with a "news-list-item" class
		$("article.news-list-item").each(function(i, element){
			// Save the link and Cheerio's find method will "find" the title
			const link = $(element).children("a").attr("href");
			const imgLink = $(element).find(".media-thumbnail-wrap").find("img").attr("src");
			const title = $(element).find("a").find("img").attr("data-title");
			const summary = $(element).find(".post-synopsis-wrap").find("p").text();
			
			// if this found elements had both title, image, link, and summary
			if (title && link){
				// Insert to data in to the lfcNews Database
				db.lfcNews.insert({
					title: title,
					imgLink: imgLink,
					link: link,
					summary: summary
				},
				    function(err, inserted) {
			          if (err) {
			            // Log the error if one is encountered during the query
			            console.log(err);
			          }
			          else {
			            // Otherwise, log the inserted data
			            console.log(inserted);
			          }
			        });
	   	  		 }
	  		  });
	  });

  // Send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});


// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});