## Simple Sentiment Analysis application

![Ambivalent Smiley](http://simplesentimentanalysis.ng.bluemix.net/images/content.png "Ambivalent Smiley")

We forked [this](https://hub.jazz.net/project/srich/Sentiment%20Analysis%20App/overview) project to use Git hosting and the continuous integration deployment pipeline.

Sample application demonstrating how to build a sentiment analysis app usind Node.js and a couple modules.  
The application takes a keyword or hashtag, connects to Twitter to get a stream of matching tweets, 
and runs those tweets through a sentiment-analysis module to produce a sentiment score.

You can play with an instance of the application running at http://simplesentimentanalysis.ng.bluemix.net/

You can explore the code by clicking into the SimpleSentimentAnalysis folder.

### Running the application on your desktop

Download the source of the application by selecting the SimpleSentimentAnalysis folder and selecting
"Export as zip" from the Actions menu(![Actions](https://hub.jazz.net/code/images/gear.png)) in the navigator.

Unzip the application in a working directory.

Use npm to get the required modules:

    npm install

Run the application with node:

    node app.js

You should see a confirmation that the application is running on port 3000, 
and you can access it with your browser at http://localhost:3000.

### Running the application using a Cloud Foundry PaaS runtime

If you have access to a Cloud Foundry-based runtime, like the Pivotal Cloud Foundry offering or IBM's BlueMix,
you can also run the application in those environments.

### Licensed under the EPL (see [license.txt](license.txt))