var port = (process.env.VCAP_APP_PORT || 3000);
var express = require("express");
var sentiment = require('sentiment');
var twitter = require('ntwitter');

var DEFAULT_TOPIC = "FIFA";

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
	consumer_key: '7bsc9DPSqUFsUoXyD2TaZgvMi',
	consumer_secret: 'cNpIYSir2V2k8akxEFlFhgSlVfT5Dut0y2msxWSQaF6BEPA5c3',
	access_token_key: '88104355-rt11OjlhJVCR3D1wHdNB51V9ppddNKxw6DweYhg4k',
	access_token_secret: '5lLS8Szd9cEOKioMGXDoaM248kIt2ZVsOsxfD1viHouMD'
});

app.get('/testtvg', function (req, res) {
	tweeter.verifyCredentials(function (error, data) {
		res.send("Hello, " + data.name + ".  I am in your twitters.");
	});
});

var tweetCount = 0;
var tweetTotalSentiment = 0;
var monitoringPhrase;
var val="";

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
	val = "Neutral";
	if (avg > 0.5) { // happy
	    val = "Positive & happy";
		return "/images/excited.png";
	}
	if (avg < -0.5) { // angry
	    val = "Negative & angry";
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
		"Here are the results of the  Twitter Sentiment Analysis app.<br>\n" + 
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
			"<title>Twitter Sentiment Analysis -1</title>\n" +
			"</HEAD>\n" +
			"<BODY>\n" +
			"<P>\n" +
			"Results of Twitter sentiment analysis <br>\n" +
			"<IMG align=\"middle\" src=\"" + sentimentImage() + "\"/><br>\n" +
			"about " + monitoringPhrase + ".<br><br>" +
			"Analyzed " + tweetCount + " tweets...<br>\n" +
			"The sentiment in Twitterverse is " + val + "<br>\n" +
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
	var phrase = 'FIFA';
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