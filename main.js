require("dotenv").load()
var SlackClient = require("slack-client")
var shuffle = require("shuffle-array")

var token = process.env.SLACK_TOKEN // slackbot's integration token.
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
		question: [],
		idea: [],
		props: []
	}
	var channel = slackbot.getChannelGroupOrDMByID(channelID)
	console.log("Starting Retro")
	channel.send("<!here|here>: Starting Retro Recording. \n Please use `+` for positive, `-` for needs improvement, `?` for questions, `!` for ideas, and `*` to give props to someone!")
}

function stopretro(channelID) {
	if (channels[channelID] === undefined) { return }
	// Shuffle Retro Feedback
	shuffle(channels[channelID].plus)
	shuffle(channels[channelID].minus)
	shuffle(channels[channelID].question)
	shuffle(channels[channelID].idea)
	shuffle(channels[channelID].props)
	// Send the full retro to post
	var channel = slackbot.getChannelGroupOrDMByID(channelID)
	var summary = "```Randomized Summary of Inputs From This Retrospective"
	summary += display(channelID, "Positives", "plus")
	summary += display(channelID, "Negatives", "minus")
	summary += display(channelID, "Questions", "question")
	summary += display(channelID, "Ideas", "idea")
	summary += display(channelID, "Props", "props")
	summary += "```"
	channel.send(summary)
	// Delete retro to reset
	delete channels[channelID]
}

function display(channelID, name, type) {
	if (channels[channelID][type].length !== 0) {
		return "\n\n# " + name + ": \n" + channels[channelID][type].join("\n")
	}
	return ""
}

function addtoarray(channelID, line, type) {
	if (line.length > 2) {
		channels[channelID][type].push(line)
		console.log(channels)
	}
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
	    		+ "For questions you may have, start your messsage with a `?`.\n\n"
	    		+ "For ideas you may have, start your messsage with a `!`.\n\n"
	    		+ "To give props to someone for a job well done or help you got, start your messsage with a `*` and mention what they did to be awesome!\n\n"
	    		+ "You can put multiple pieces of feedback in one message if you'd rather not print each thought on a new line.\n\n"
	    		+ "I was made by kat. Please direct questions or feedback to her.")
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
				case "!":
					addtoarray(message.channel, lines[i], "idea")
					break
				case "*":
					addtoarray(message.channel, lines[i], "props")
					break
			}
		}
	}
}

slackbot.login()

