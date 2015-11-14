var SlackClient = require("slack-client")
var shuffle = require("shuffle-array")

var token = "xoxb-14558007971-sBnunZdIb59EopEAKyIcLt57" // slackbot's integration token.
var autoReconnect = true // Automatically reconnect after an error response from Slack.
var autoMark = true // Automatically mark each message as read after it is processed.
var channels = {}

var slackbot = new SlackClient(token, autoReconnect, autoMark)

slackbot.on("open", slackopened)
slackbot.on("message", slackmessage)

function slackopened() {
	console.log("I'm alive!")
}

function isMessageForMe(message) {
  return (message.text && message.text.substr(0, 12) === `<@${slackbot.self.id}>`);
}

function startretro(channelID) {
	channels[channelID] = {
		plus: [],
		minus: [],
		question: []
		users: []
	}
	var channel = slackbot.getChannelGroupOrDMByID(channelID)
	console.log("Starting Retro")
	channel.send("<!here|here>: Starting Retro Recording. \n Please use + for positive, - for negative, and ? for questions!")
}

function stopretro(channelID) {
	if (channels[channelID] === undefined) { return }
	// Shuffle Retro Feedback
	shuffle(channels[channelID].plus)
	shuffle(channels[channelID].minus)
	shuffle(channels[channelID].question)
	// Send the full retro to post
	var channel = slackbot.getChannelGroupOrDMByID(channelID)
	var summary = "```Randomized Summary of Inputs From This Retrospective \n\n"
	summary += "# Positives: \n" + channels[channelID].plus.join("\n")
	summary += "\n\n# Negatives: \n" + channels[channelID].minus.join("\n")
	summary += "\n\n# Questions: \n" + channels[channelID].question.join("\n")
	summary += "```"
	channel.send(summary)
	// Delete retro to reset
	delete channels[channelID]
}

function addtoarray(channelID, line, type) {
	if (line.length > 2) {
		channels[channelID][type].push(line)
		console.log(channels)
	}
}

function adduser(channelID) {

}

function slackmessage(message) {
	// console.log(message.text, message.channel, message.user)
	if (! message.text) { return }
	var channel = slackbot.getChannelGroupOrDMByID(message.channel)
	if (isMessageForMe(message)) {
	    if (message.text.indexOf("start") >= 0) {
	    	startretro(message.channel)
	    }
	    else if (message.text.indexOf("stop") >= 0) {
	    	stopretro(message.channel)
	    }
	    else if (message.text.indexOf("help") >=0) {
	    	channel.send("Let me help you make retrospectives great!\n"
	    		+ "To start your retrospective type `@retrobot start`. "
	    		+ "To end the retrospective and print out a randomized summary of feedback type `@retrobot stop`.\n\n"
	    		+ "To make a positive remark, start your message with `+`. Negative or needs improvement, start with `-`. "
	    		+ "For questions or ideas, start your messsage with a `?`\n\n"
	    		+ "You can put multiple pieces of feedback in one message if you'd rather not print each thought on a new line.\n\n"
	    		+ "I was made by @kat. Please direct questions or feedback to her.")
	    }
	    else {
	    	channel.send("That is not a retro command! (Try @retrobot help)")
	    }
    }

	else if (channels[message.channel] !== undefined) {
		
		var lines = message.text.split("\n")
		console.log(lines)
		for (i in lines) {
			console.log(lines[i])
			var char1 = lines[i].substr(0,1)
			switch(char1) {
				case "+":
					addtoarray(message.channel, lines[i], "plus")
					break
				case "-":
					addtoarray(message.channel, lines[i], "minus")
					break
				case "?":
					addtoarray(message.channel, lines[i], "question")
					break
			}
		}
	}
}

slackbot.login()

