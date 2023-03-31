// Require the necessary node classes
const fs = require('node:fs');
const path = require('node:path');
// Require the necessary discord.js classes
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
// Initialize .env config file
require('dotenv').config();
// Import functions and const
const { isAdmin, disableCheck, splitMessage, sendCmdResp, checkTokens, formatDate, callOpenAIWithRetry, initPersonalities, getPersonality, getPersonalityEmbed } = require('./helpers');
const { modelName, API_ERROR_MSG, DISABLED_MSG, CASE_MODE, REPLY_MODE, BOT_REPLIES, DISABLED_REPLIES, EMBED_RESPONSE } = require('./constants');

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
	timer: null,
	tokenCount: null
};

// Run function
initPersonalities(state.personalities, process.env);



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
	p = getPersonality(msg.content.toUpperCase(),state);
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

	// Check permissions and tokens
    const permissionCheckResult = await checkTokens(msg, state);
    if (!permissionCheckResult.result) {
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
		const response = await callOpenAIWithRetry(() => chat(p.request, msg), 3, 5000);
		console.log(`[${formatDate(new Date())}] Received API response.`);
		// Split response if it exceeds the Discord 2000 character limit
		const responseChunks = splitMessage(response, 2000)
		// Send the split API response
		for (let i = 0; i < responseChunks.length; i++) {
			let full_msg;
			if (EMBED_RESPONSE) {
				const isSplit = responseChunks.length > 1 && i > 0;
				const msgEmbed = getPersonalityEmbed(p, responseChunks[i], msg.author, isSplit);
				full_msg = {embeds: [msgEmbed]};
			} else {
				full_msg = responseChunks[i];
			}
			sendCmdResp(msg, full_msg, i === 0);
		}
	} catch (error) {
		console.error(`[${formatDate(new Date())}] Message processing failed:`, error);
		return;
	}
});

// API request function
async function chat(requestX, msg){
	try {
		// Make API request
		const completion = await openai.createChatCompletion({
			model: modelName,
			messages: requestX
		});

		// Increase token counter if not admin
		if (!isAdmin(msg, false)) {
			state.tokenCount += completion.data.usage.completion_tokens;
		}
		
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
		// Add assistant message to next request
		requestX.push({"role": "assistant", "content": `${completion.data.choices[0].message.content}`});

		// Return response
		return responseContent;
	} catch (error) {
		console.error(`[${formatDate(new Date())}] [ERROR] OpenAI API request failed: ${error}`);
		return API_ERROR_MSG;
	}
}

// Log in to Discord with your client's token
client.login(process.env.CLIENT_TOKEN);