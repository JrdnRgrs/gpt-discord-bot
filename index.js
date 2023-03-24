// Import functions and const
const { isAdmin, splitMessage, sendCmdResp, textToSpeech, formatDate, callOpenAIWithRetry, voiceEmbed } = require('./helpers');
const { voiceDescriptions, voiceMapping, ne_voiceDescriptions, modelName, botCommand, DISABLED_MSG, COMMAND_PERM_MSG, ENABLE_MSG, DISABLE_MSG, RESET_MSG, DYNAMIC_RESET_MSG, RESET_ERROR_MSG, PERSONALITY_MSG, CASE_MODE, REPLY_MODE, BOT_REPLIES} = require('./constants');
// Require the necessary discord.js classes
const { Client, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
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
		if (isAdmin(msg)) {
			client.isPaused = true;
			sendCmdResp(msg, DISABLE_MSG);
		} else {
			sendCmdResp(msg, COMMAND_PERM_MSG);
			return;
		}
	}
	if (msg.content === botCommand + 'enable') {
		if (isAdmin(msg)) {
			client.isPaused = false;
			sendCmdResp(msg, ENABLE_MSG);
		} else {
			sendCmdResp(msg, COMMAND_PERM_MSG);
			return;
		}
	}

    // Reset bot command
	if (msg.content.startsWith(botCommand + 'reset')) {
		// Check disabled status
		if (client.isPaused === true && !isAdmin(msg)) {
			sendCmdResp(msg, DISABLED_MSG);
			return;
		}
		let cutMsg = msg.content.slice(7);
		// Delete all memories if message is "!reset all"
		if (cutMsg === 'all') {
			initPersonalities();
			sendCmdResp(msg, RESET_MSG);
			return;
		} else {
			// Check what personality's memory to delete
			for (let i = 0; i < personalities.length; i++) {
				let thisPersonality = personalities[i];
				if (cutMsg.toUpperCase().startsWith(thisPersonality.name.toUpperCase())) {
					let originalSystemMessage = thisPersonality.request.find(msg => msg.role === 'system');
					personalities[i] = { "name": thisPersonality.name, "request" : [originalSystemMessage]};
					sendCmdResp(msg, DYNAMIC_RESET_MSG.replace('<p>', thisPersonality.name));
					return;
				}
			}
			// Return error if reset message does not match anything
			sendCmdResp(msg, RESET_ERROR_MSG);
			return;
		}
	}

    // List personalities bot command
	if (msg.content === botCommand + 'personalities') {
		// Check disabled status
		if (client.isPaused === true && !isAdmin(msg)) {
		  sendCmdResp(msg, DISABLED_MSG);
		  return;
		}
		// Create an embed object
		let persEmbed = new EmbedBuilder()
		  .setColor(0x0099FF) // set the color of the embed
		  .setTitle(PERSONALITY_MSG) // set the title of the embed
		  .setDescription('Here are some personalities and their prompts'); // set the description of the embed
	  
		// Add personality names and prompts to fields
		for (let i = 0; i < personalities.length; i++) {
		  let thisPersonality = personalities[i];
		  // Find the prompt from the request array
		  let prompt = thisPersonality.request.find(item => item.role === 'system').content;
		  // Truncate the prompt to 1024 characters if it's longer than that
		  let truncatedPrompt = prompt.substring(0, 1024);
		  persEmbed.addFields({ name: thisPersonality.name, value: truncatedPrompt });
		}
	  
		// Send the embed
		sendCmdResp(msg, { embeds: [persEmbed] });
	  }

	if (msg.content.startsWith(botCommand + 'say')) {
		const input = msg.content.split(' ').slice(1);
		const messageIdOrNumBack = !isNaN(input[0]) ? input.shift() : 1;
		const speakerKey = input.length > 0 && voiceMapping.hasOwnProperty(input[0].toLowerCase()) ? input.shift().toLowerCase() : "default";
		const botMessages = Array.from(msg.channel.messages.cache.filter(m => m.author.bot).values());
	
		let lastBotMessage = null;
	
		if (messageIdOrNumBack.toString().length > 2) { // Message ID
			try {
				lastBotMessage = await msg.channel.messages.fetch(messageIdOrNumBack);
				if (!lastBotMessage.author.bot) {
					lastBotMessage = null;
				}
			} catch (error) {
				console.error('Error fetching message by ID:', error);
			}
		} else { // Number of messages back
			const filteredBotMessages = botMessages.filter(m => m.attachments.size === 0);
			if (filteredBotMessages.length >= messageIdOrNumBack) {
				lastBotMessage = filteredBotMessages[filteredBotMessages.length - messageIdOrNumBack];
			}
		}
	
		if (lastBotMessage) {
			const messageContent = lastBotMessage.content.trim().replace(/^[^:]*:\s*/, '');
			const voice = voiceMapping[speakerKey];
	
			try {
				const audioFilename = await textToSpeech(voice, messageContent);
	
				msg.channel.send({
					files: [{
						attachment: audioFilename,
						name: `${speakerKey}_tts.mp3`
					}]
				}).then(() => {
					fs.unlink(audioFilename, (err) => {
						if (err) {
							console.error(err);
						}
					});
				});
			} catch (error) {
				console.error(error);
				msg.reply('Error generating audio. Please try again later.');
			}
		} else {
			msg.channel.send("No valid bot message found.");
		}
	}

	if (msg.content.startsWith(botCommand + 'tts')) {
        // Check disabled status
        if (client.isPaused === true && !isAdmin(msg)) {
            sendCmdResp(msg, DISABLED_MSG);
            return;
        }

        const regex = /^[^a-zA-Z]+tts\s+(\S+)\s+(.+)/;
        const matches = msg.content.match(regex);

        // Check for correct command format
        if (!matches) {
            msg.reply('Invalid command format. Use: !tts <speaker> "<text>" (or !tts <speaker> <messageID>)');
            return;
        }
		
        let speakerKey = matches[1].toLowerCase();
		let text = matches[2];

		if (text.length > 2 && !isNaN(text)) { // Check if the text argument is a message ID
			try {
				const fetchedMessage = await msg.channel.messages.fetch(text);
				text = fetchedMessage.content;
			} catch (error) {
				console.error('Error fetching message by ID:', error);
				msg.reply("Invalid message ID. Please provide a valid message ID (from this channel) or text.");
				return;
			}
		}

		// Validate speaker
        if (!voiceMapping.hasOwnProperty(speakerKey)) {
            msg.reply('Invalid speaker. Please use a valid speaker name.');
            return;
        }

        const speaker = voiceMapping[speakerKey];

        const voiceRegex = /(?<=^[^_]+_[^_]+_).+/;
        const speaker_name = speaker.match(voiceRegex)
        try {
            const audioFilename = await textToSpeech(speaker, text);

            // Send the generated audio file to the Discord channel
            msg.channel.send({
                files: [{
                    attachment: audioFilename,
                    name: `${speaker_name}_tts.mp3`
                }]
            }).then(() => {
                // Remove the file after sending
                fs.unlink(audioFilename, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
            });
        } catch (error) {
            console.error(error);
            msg.reply('Error generating audio. Please try again later.');
        }
    }

	if (msg.content.startsWith(botCommand + 'help')) {
		// create an embed object
		let helpEmbed = new EmbedBuilder()
			.setColor(0x0099FF) // set the color of the embed
			.setTitle('**Bot Commands**') // set the title of the embed
			.setDescription('Here are some commands you can use'); // set the description of the embed
	
		// add fields to the embed for each command and its usage
		helpEmbed.addFields(
			{ name: `${botCommand}enable`, value: 'Enables the bot.' },
			{ name: `${botCommand}disable`, value: 'Disables the bot.' },
			{ name: `${botCommand}reset`, value: `Resets the memory of all personalities or a single personality. \n \`${botCommand}reset [all,<personality_name>]\`` },
			{ name: `${botCommand}personality`, value: 'Displays all personalities and their prompts.' },
			{ name: `${botCommand}tts`, value: `Generates TTS for a message. \n \`${botCommand}tts <speaker> [<text>,<messageID>] \`` },
			{ name: `${botCommand}say`, value: `Generates TTS for a bot message. With no input, uses the last message with \`rocket\`. Both arguments are optional. \n \`${botCommand}say [<number>,<messageID>] <speaker>\`` },
			{ name: `${botCommand}speakers`, value: `Displays all TTS speakers available to the \`${botCommand}tts\` command.` },
			{ name: `${botCommand}sample`, value:`Listen to samples of each available speaker to the \`${botCommand}tts\` command. \n \`${botCommand}sample <speaker>\``},
			{ name:`${botCommand}help`,value:'Displays this help message.'}
		);
	
		// send the embed to the channel
		msg.channel.send({ embeds:[helpEmbed] });
	}

	if (msg.content.startsWith(botCommand + 'speakers')) {
		const [, ne_voices] = msg.content.split(' ')
		let voiceEmbed_en = voiceEmbed(voiceDescriptions, 'English Speakers')
		// send the embed to the channel
		msg.channel.send({ embeds: [voiceEmbed_en] });

		if(ne_voices == "all"){
			let voiceEmbed_ne = voiceEmbed(ne_voiceDescriptions, 'Non-English Speakers')
			// send the embed to the channel
			msg.channel.send({ embeds: [voiceEmbed_ne] });
		}
		
	}

    if (msg.content.startsWith(botCommand + 'sample')) {
        // Extract the speakerKey from the command
        const [, speakerKey] = msg.content.split(' ');
    
        // Check if the speakerKey is valid
        if (voiceMapping.hasOwnProperty(speakerKey)) {
            const speaker = voiceMapping[speakerKey];
            const audioFilePath = path.join(__dirname, `voices/${speaker}.mp3`);
    
            // Check if the audio file exists
            fs.access(audioFilePath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error(err);
                    msg.reply('Error: Sample audio file not found.');
                } else {
                    // Send the sample audio file to the Discord channel
                    msg.channel.send({
                        files: [{
                            attachment: audioFilePath,
                            name: `${speakerKey}.mp3`
                        }]
                    });
                }
            });
        } else {
            msg.reply('Invalid speaker. Please use a valid speaker name.');
        }
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