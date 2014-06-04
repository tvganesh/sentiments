var port = (process.env.VCAP_APP_PORT || 3000);
var express = require("express");
var sentiment = require('sentiment');
var twitter = require('ntwitter');

var DEFAULT_TOPIC = "Justin Bieber";

// defensiveness against errors parsing request bodies...
process.on('uncaughtException', function (err) {
	console.log('Caught exception: ' + err.stack);
});

var app = express();
// Configure the app web container
app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));
});

// Sample keys for demo and article - you must get your own keys if you clone this application!
// Create your own app at: https://dev.twitter.com/apps
var tweeter = new twitter({
	consumer_key: 'XDMBT427fgVzosqZlu07A',
	consumer_secret: 'eWXL4TRv5B2UEHJ8cClCWt4Z2rF7yQIaVAbmj6A',
	access_token_key: '14526702-uRxyEJuAcegZdlPahmMjY5gHIFleFiRL2ITpd0NR0',
	access_token_secret: 'PrXTHWP2Mcpr7t1d7JCIaFlIR2yDcymeNFAhfqS9Y'
});

app.get('/twitterCheck', function (req, res) {
	tweeter.verifyCredentials(function (error, data) {
		res.send("Hello, " + data.name + ".  I am in your twitters.");
	});
});

var tweetCount = 0;
var tweetTotalSentiment = 0;
var monitoringPhrase;

app.get('/sentiment', function (req, res) {
	res.json({monitoring: (monitoringPhrase !== null), 
		monitoringPhrase: monitoringPhrase,
		tweetCount: tweetCount,
		tweetTotalSentiment: tweetTotalSentiment,
		sentimentImageURL: sentimentImage()});
});

app.post('/sentiment', function (req, res) {
	try {
		if (req.body.phrase) {
			beginMonitoring(req.body.phrase);
			res.send(200);			
		} else {
			res.status(400).send('Invalid request: send {"phrase": "bieber"}');		
		}
	} catch (exception) {
		res.status(400).send('Invalid request: send {"phrase": "bieber"}');
	}
});

function resetMonitoring() {
	monitoringPhrase = "";
}

function beginMonitoring(phrase) {
	var stream;
	// cleanup if we're re-setting the monitoring
	if (monitoringPhrase) {
		resetMonitoring();
	}
	monitoringPhrase = phrase;
	tweetCount = 0;
	tweetTotalSentiment = 0;
	tweeter.verifyCredentials(function (error, data) {
		if (error) {
			return "Error connecting to Twitter: " + error;
		} else {
			stream = tweeter.stream('statuses/filter', {
				'track': monitoringPhrase
			}, function (stream) {
				console.log("Monitoring Twitter for " + monitoringPhrase);
				stream.on('data', function (data) {
					// only evaluate the sentiment of English-language tweets
					if (data.lang === 'en') {
						sentiment(data.text, function (err, result) {
							tweetCount++;
							tweetTotalSentiment += result.score;
						});
					}
				});
			});
			return stream;
		}
	});
}

function sentimentImage() {
	var avg = tweetTotalSentiment / tweetCount;
	if (avg > 0.5) { // happy
		return "/images/excited.png";
	}
	if (avg < -0.5) { // angry
		return "/images/angry.png";
	}
	// neutral
	return "/images/content.png";
}

app.get('/', function (req, res) {
	var welcomeResponse = "<HEAD>" +
		"<title>Twitter Sentiment Analysis</title>\n" +
		"</HEAD>\n" +
		"<BODY>\n" +
		"<P>\n" +
		"Welcome to the Twitter Sentiment Analysis app.<br>\n" + 
		"What would you like to monitor?\n" +
		"</P>\n" +
		"<FORM action=\"/monitor\" method=\"get\">\n" +
		"<P>\n" +
		"<INPUT type=\"text\" name=\"phrase\" value=\"" + DEFAULT_TOPIC + "\"><br><br>\n" +
		"<INPUT type=\"submit\" value=\"Go\">\n" +
		"</P>\n" + "</FORM>\n" + "</BODY>";
	if (!monitoringPhrase) {
		res.send(welcomeResponse);
	} else {
		var monitoringResponse = "<HEAD>" +
			"<META http-equiv=\"refresh\" content=\"5; URL=http://" +
			req.headers.host +
			"/\">\n" +
			"<title>Twitter Sentiment Analysis</title>\n" +
			"</HEAD>\n" +
			"<BODY>\n" +
			"<P>\n" +
			"The Twittersphere is feeling<br>\n" +
			"<IMG align=\"middle\" src=\"" + sentimentImage() + "\"/><br>\n" +
			"about " + monitoringPhrase + ".<br><br>" +
			"Analyzed " + tweetCount + " tweets...<br>" +
			"</P>\n" +
			"<A href=\"/reset\">Monitor another phrase</A>\n" +
			"</BODY>";
		res.send(monitoringResponse);
	}
});

app.get('/testSentiment', function (req, res) {
	var response = "<HEAD>" +
		"<title>Twitter Sentiment Analysis</title>\n" +
		"</HEAD>\n" +
		"<BODY>\n" +
		"<P>\n" +
		"Welcome to the Twitter Sentiment Analysis app.  What phrase would you like to analyze?\n" +
		"</P>\n" +
		"<FORM action=\"/testSentiment\" method=\"get\">\n" +
		"<P>\n" +
		"Enter a phrase to evaluate: <INPUT type=\"text\" name=\"phrase\"><BR>\n" +
		"<INPUT type=\"submit\" value=\"Send\">\n" +
		"</P>\n" +
		"</FORM>\n" +
		"</BODY>";
	var phrase = req.query.phrase;
	if (!phrase) {
		res.send(response);
	} else {
		sentiment(phrase, function (err, result) {
			response = 'sentiment(' + phrase + ') === ' + result.score;
			res.send(response);
		});
	}
});

app.get('/monitor', function (req, res) {
	beginMonitoring(req.query.phrase);
	res.redirect(302, '/');
});

app.get('/reset', function (req, res) {
	resetMonitoring();
	res.redirect(302, '/');
});

app.get('/hello', function (req, res) {
	res.send("Hello world.");
});

app.get('/watchTwitter', function (req, res) {
	var stream;
	var testTweetCount = 0;
	var phrase = 'bieber';
	// var phrase = 'ice cream';
	tweeter.verifyCredentials(function (error, data) {
		if (error) {
			res.send("Error connecting to Twitter: " + error);
		}
		stream = tweeter.stream('statuses/filter', {
			'track': phrase
		}, function (stream) {
			res.send("Monitoring Twitter for \'" + phrase + "\'...  Logging Twitter traffic.");
			stream.on('data', function (data) {
				testTweetCount++;
				// Update the console every 50 analyzed tweets
				if (testTweetCount % 50 === 0) {
					console.log("Tweet #" + testTweetCount + ":  " + data.text);
				}
			});
		});
	});
});

app.listen(port);
console.log("Server listening on port " + port);