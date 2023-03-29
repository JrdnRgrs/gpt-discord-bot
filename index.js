// Require the necessary node classes
const fs = require('node:fs');
const path = require('node:path');
// Require the necessary discord.js classes
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
// Initialize .env config file
require('dotenv').config();
// Import functions and const
const { isAdmin, splitMessage, sendCmdResp, formatDate, callOpenAIWithRetry, initPersonalities } = require('./helpers');
const { modelName, API_ERROR_MSG, DISABLED_MSG, CASE_MODE, REPLY_MODE, BOT_REPLIES, DISABLED_REPLIES} = require('./constants');

// Require openai and set API key and setup
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Create a new Discord client instance
const client = new Client({intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,] });

// Initialize Commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
// Initialize command files
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Console log when logged in
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});


// Create state array
let state = {
	isPaused: false,
	personalities: [],
};

// Run function
initPersonalities(state.personalities, process.env);

// Get current personality from message
function getPersonality(message) {
    let personality = null;
    let earliestIndex = Infinity;

    // For each personality, check if the message includes the exact name of the personality
    for (let i = 0; i < state.personalities.length; i++) {
        let thisPersonality = state.personalities[i];
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

// Listen for interactions/Commands
client.on(Events.InteractionCreate, async interaction => {
	// Don't do anything if the interaction is not a slash command
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	// Execute the command and log errors if they appear
	try {
		await command.execute(interaction, state);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}

})

client.on('messageCreate', async msg => {
	// Don't do anything when message is from self or bot depending on config
	if (BOT_REPLIES === 'true') {
		if (msg.author.id === client.user.id) return;
	} else {
		if (msg.author.bot) return;
	}

	// Run get personality from message function
	p = getPersonality(msg.content.toUpperCase());
	// Check if message is a reply if no personality name
	if (p == null && msg.reference?.messageId) {
		let refMsg = await msg.fetchReference();
		// Check if the reply is to the bot
		if (refMsg.author.id === client.user.id) {
			// Check the personality that the message being replied to is from
			p = state.personalities.find(pers => pers.request.some(element => (element.content === refMsg.content)));
		}
	}
	if (p == null) return;

	// Check if bot disabled/enabled
	if (state.isPaused === true && !isAdmin(null, msg)) {
		if(DISABLED_REPLIES === "true"){
			sendCmdResp(msg, DISABLED_MSG);
			return;
		} else {
			return;
		}
	}

	// Add user message to request
	p.request.push({"role": "user", "content": `${msg.content}`});
	try {
		// Start typing indicator
		msg.channel.sendTyping();
		console.log(`[${formatDate(new Date())}] Making API request...`);

		// Run API request function
		//const response = await chat(p.request);
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
		console.error(`[${formatDate(new Date())}] Message processing failed:`, error);
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
				console.log('[WARNING] Invalid CASE_MODE value. Please change and restart bot.');
		}
		// Return response
		return responseContent;
	} catch (error) {
		//console.error('API request failed:', error);
		console.error(`[${formatDate(new Date())}] [ERROR] OpenAI API request failed: ${error}`);
		return API_ERROR_MSG;
	}
}

// Log in to Discord with your client's token
client.login(process.env.CLIENT_TOKEN);