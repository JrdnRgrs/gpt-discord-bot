// Import functions and const
const { isAdmin, splitMessage, sendCmdResp, formatDate, callOpenAIWithRetry } = require('./helpers');
const { modelName, botCommand, DISABLED_MSG, CASE_MODE, REPLY_MODE, BOT_REPLIES} = require('./constants');

// Import Bot Commands
const disable = require('./commands/disable');
const enable = require('./commands/enable');
const reset = require('./commands/reset');
const personalitiesCommand = require('./commands/personalities');
const say = require('./commands/say');
const tts = require('./commands/tts');
const help = require('./commands/help');
const speakers = require('./commands/speakers');
const sample = require('./commands/sample');

// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require('discord.js');
// Initialize .env config file
require('dotenv').config();
// Require openai and set API key and setup
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Create a new Discord client instance
const client = new Client({intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,] });

// Console log when logged in
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Create personalities array
let personalities;

// Initialize personalities function
function initPersonalities() {
	personalities = [];
	let envKeys = Object.keys(process.env);
	// For each variable in .env check if starts with personality_ and add to personalities array if true
	envKeys.forEach(element => {
		if (element.startsWith('personality_')) {
			name = element.slice(12);
			//personalities.push({ "name": name, "request" : [{"role": "system", "content": `${process.env[element]}`}]})
            personalities.push({ 
                "name": name, 
                "prompt": process.env[element],
                "request": [{
                    "role": "system",
                    "content": `${process.env[element]}`
                }]
            });
		}
	});
}
// Run function
initPersonalities();

// Get current personality from message
function getPersonality(message) {
    let personality = null;
    let earliestIndex = Infinity;

    // For each personality, check if the message includes the exact name of the personality
    for (let i = 0; i < personalities.length; i++) {
        let thisPersonality = personalities[i];
        const regex = new RegExp('\\b' + thisPersonality.name.toUpperCase() + '\\b');
        const match = regex.exec(message);

        if (match && match.index < earliestIndex) {
            personality = thisPersonality;
            earliestIndex = match.index;
        }
    }

    // Return the personality of the message
    return personality;
}
// Create Pause var
client.isPaused = false;

client.on('messageCreate', async msg => {
	// Don't do anything when message is from the bot itself or from other bots, based on the BOT_REPLIES environment variable
	if (msg.author.id === client.user.id || (msg.author.bot && BOT_REPLIES !== "true")) return;

	// Enable/Disable bot commands
	if (msg.content === botCommand + 'disable') {
        disable(msg, client);
        return;
    }
	if (msg.content === botCommand + 'enable') {
        enable(msg, client);
        return;
    }

    // Reset bot command
	if (msg.content.startsWith(botCommand + 'reset')) {
		reset(msg, client, initPersonalities, personalities);
        return;
	}

    // List personalities bot command
	if (msg.content === botCommand + 'personalities') {
		personalitiesCommand(msg, client, personalities);
		return;
	  }

	if (msg.content.startsWith(botCommand + 'say')) {
		say(msg, client)
		return;
	}

	if (msg.content.startsWith(botCommand + 'tts')) {
		tts(msg, client)
		return;
    }

	if (msg.content.startsWith(botCommand + 'help')) {
		help(msg, client)
		return;
	}

	if (msg.content.startsWith(botCommand + 'speakers')) {
		speakers(msg, client)
		return;
	}

    if (msg.content.startsWith(botCommand + 'sample')) {
		sample(msg, client)
		return;
    }

	// Run get personality from message function
	p = getPersonality(msg.content.toUpperCase());
	if (p == null) return;

	// Check if bot disabled/enabled
	if (client.isPaused === true && !isAdmin(msg)) {
		sendCmdResp(msg, DISABLED_MSG);
		return;
	}

	// Add user message to request
	p.request.push({"role": "user", "content": `${msg.content}`});
	try {
		// Start typing indicator
		msg.channel.sendTyping();
		console.log(`[${formatDate(new Date())}] Making API request...`);

		// Run API request function
		//const response = await chat(p.request);
		// Call the chat function with retry handling
		const response = await callOpenAIWithRetry(() => chat(p.request), 3, 5000);

		console.log(`[${formatDate(new Date())}] Received API response.`);
		// Split response if it exceeds the Discord 2000 character limit
		const responseChunks = splitMessage(response, 2000)
		// Send the split API response
		for (let i = 0; i < responseChunks.length; i++) {
			if (REPLY_MODE === 'true' && i === 0) {
				msg.reply(responseChunks[i]);
			} else {
				msg.channel.send(responseChunks[i]);
			}
		}
	} catch (error) {
		//console.error('Message processing failed:', error);
		console.error(`[${formatDate(new Date())}] Message processing failed:`, error);
		msg.channel.send('An error occurred while processing the message.');
		return;
	  }
});

// API request function
async function chat(requestX){
	try {
		// Make API request
		const completion = await openai.createChatCompletion({
			model: modelName,
			messages: requestX
		});

		// Add assistant message to next request
		requestX.push({"role": "assistant", "content": `${completion.data.choices[0].message.content}`});
		let responseContent;

		// Check capitlization mode
		switch (CASE_MODE) {
			case "":
				responseContent = completion.data.choices[0].message.content;
				break;
			case "upper":
				responseContent = completion.data.choices[0].message.content.toUpperCase();
				break;
			case "lower":
				responseContent = completion.data.choices[0].message.content.toLowerCase();
				break;
			default:
				console.log('Invalid CASE_MODE value. Please change and restart bot.');
		}
		// Return response
		return responseContent;
	} catch (error) {
		//console.error('API request failed:', error);
		console.error(`[${formatDate(new Date())}] API request failed:`, error);
		throw error;
	}
}

// Log in to Discord with your client's token
client.login(process.env.CLIENT_TOKEN);