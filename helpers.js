// Global functions file
const { BASE_URL, REPLY_MODE, SESSION_ID, ADMIN_ID, DYNAMIC_TITLE_MSG, DISABLED_MSG, DISABLED_REPLIES, TOKEN_LIMIT_MSG, TOKEN_RESET_TIME, TOKEN_NUM, API_ERROR_MSG, modelName, CASE_MODE} = require('./constants');
// Require TikTok TTS package and store sessionID and URL
const { config, createAudioFromText } = require('tiktok-tts');
config(SESSION_ID, BASE_URL);
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
// Require ffmpeg, fs, path, child_process for working with audio files
const fs = require('fs');
//const axios = require('axios');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

// General functions for the bot
// Set admin user IDs
const adminId = ADMIN_ID.split(',');
function isAdmin(msg) {
    if (!msg.member || !msg.author) {
        return false;
    }

    if (msg.member.permissions.has(PermissionFlagsBits.Administrator) || msg.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return true;
    } else {
        return isAdminInAdminId(msg.author.id);
    }
}

function isAdminInteraction(interaction) {
    const member = interaction.member;
    const user = interaction.user || interaction.author;

    if (!member || !user) {
        return false;
    }

    if (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return true;
    } else {
        return isAdminInAdminId(user.id);
    }
}
async function disableCheck(message, interaction, state, disabledMessage, isMessage) {
    const isAdminCheck = isMessage
        ? isAdmin(message)
        : interaction
        ? isAdminInteraction(interaction)
        : false;

    if (state.isPaused && !isAdminCheck) {
        if (isMessage && message) {
            sendCmdResp(message, disabledMessage);
        } else if (interaction) {
            await interaction.reply({ content: disabledMessage, ephemeral: true });
        }
        return false;
    }
    return true;
}
async function canProceed(message, interaction, state, strict = false) {
    const isMessage = message !== undefined;
    const isInteraction = interaction !== undefined;
    let isAdminCheck = false;

    if (isMessage) {
        isAdminCheck = isAdmin(message);
    } else if (isInteraction) {
        isAdminCheck = isAdminInteraction(interaction);
    }

    const disableCheckResult = await disableCheck(
        message,
        interaction,
        state,
        DISABLED_MSG,
        isMessage
    );
    if (!disableCheckResult) {
        return { result: false, isAdmin: isAdminCheck };
    }

    if (strict && (!isAdminCheck || !isAdminInAdminId(isMessage ? message.author.id : interaction.user.id))) {
        return { result: false, isAdmin: false };
    }

    return { result: true, isAdmin: isAdminCheck };
}

function isAdminInAdminId(userId) {
    return adminId.includes(userId);
}
// Send command responses function
function sendCmdResp(msg, cmdResp, useReply = false) {
    if (REPLY_MODE === 'true' && useReply) {
        msg.reply(cmdResp);
    } else {
        msg.channel.send(cmdResp);
    }
}
// Check tokens function
async function checkTokens(msg, state) {
    // Check if admin and if the bot is disabled/enabled
    const disableCheckResult = await canProceed(msg, undefined, state);
    if (!disableCheckResult.result) {
        return { result: false };
    }

	// Bypass token limit checks if TOKEN_RESET_TIME or TOKEN_NUM are set to 0 or not set
	if (!TOKEN_RESET_TIME || !TOKEN_NUM || parseInt(TOKEN_RESET_TIME, 10) === 0 || parseInt(TOKEN_NUM, 10) === 0) {
		return { result: true };
	}

    // Token limit check
    if (!disableCheckResult.isAdmin) {
        timePassed = Math.abs(new Date() - state.timer);
        // Set variables on first start or when time exceeds timer
        if (timePassed >= parseInt(TOKEN_RESET_TIME, 10) || state.timer === null) {
            state.timer = new Date();
            state.tokenCount = 0;
        }

		// Send message when token limit reached
        if (timePassed < parseInt(TOKEN_RESET_TIME, 10) && state.nonAdminTokenCount >= parseInt(TOKEN_NUM, 10)) {
            sendCmdResp(msg, TOKEN_LIMIT_MSG.replace("<m>", Math.round((parseInt(TOKEN_RESET_TIME, 10) - timePassed) / 60000 * 10) / 10));
            return { result: false };
        }
    }

    return { result: true };
}

// API request function
async function chat(requestX, msg, state, openai){
	try {
		// Make API request
		const completion = await openai.createChatCompletion({
			model: modelName,
			messages: requestX,
            max_tokens: 2000
            //presence_penalty: 1.5,
            //temperature: 1.5
		});

		// Increase token counter based on user's admin status
		if (isAdmin(msg)) {
			state.adminTokenCount += completion.data.usage.completion_tokens;
		  } else {
			state.nonAdminTokenCount += completion.data.usage.completion_tokens;
		}
		// Increase total token count
		state.totalTokenCount += completion.data.usage.total_tokens;
		
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

// // Initialize personalities function
function initPersonalities(personalities, env) {
	let envKeys = Object.keys(env);
	// For each variable in .env check if starts with personality_ and add to personalities array if true
	envKeys.forEach(element => {
		const matches = /^personality_([^_]+)(?:_(.*))?$/.exec(element);

		if (matches) {
			const name = matches[1];
			const key = matches[2];
			const value = env[element];

			let personality = personalities.find((p) => p.name === name);

			if (!personality) {
				personality = {
					name: name,
					prompt: value,
					request: [
					  {
						role: 'system',
						content: value
					  }
					]
				};
				personalities.push(personality);
			}

			// Set the property dynamically based on the key
			if (key) {
				personality[key.toLowerCase()] = value;
			} else {
				personality.prompt = value;
				personality.request[0].content = value;
			}
		}
	});
}

// Get current personality from message
function getPersonality(message, state) {
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

function capitalizeFirstLetter(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
  }
function getPersonalityEmbed(personality, text, author, isSplit) {
	// create an embed object
	const dynTitle = isSplit ? ' ' : `**${DYNAMIC_TITLE_MSG.replace('<p>', capitalizeFirstLetter(personality.name))}**`;
	let personEmbed = new EmbedBuilder()
		.setColor(0x0099FF) // set the color of the embed
		.setTitle(`${dynTitle}`) // set the title of the embed
		.setDescription(text) // set the description of the embed
		.setFooter({ text: `${author.username}#${author.discriminator}` });
	if (personality.thumbnail && !isSplit) {
		personEmbed.setThumbnail(personality.thumbnail);
	}else {

	}
	return personEmbed;
}

// Split message function
function splitMessage(resp, charLim) {
	const responseNum = Math.ceil(resp.length / charLim);
	const responses = new Array(responseNum);
	// For the number of split responses, if its the last response, make the size the character limit, else make the size the last index of a space that is under 2000 characters
	for (let i = 0, c = 0, chunkSize = null; i < responseNum; i++, c+=chunkSize) {
		if (i + 1 >= responseNum) {
			chunkSize = charLim;
		} else {
					chunkSize = resp.substr(c, charLim).lastIndexOf(" ");
		}
		responses[i] = resp.substr(c, chunkSize);
	}
	return responses;
}



// Format the date into [yyyy-MM-DD HH:mm:ss]
function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Call openAI API, and retry if 502 response
async function callOpenAIWithRetry(apiCall, retries, delay) {
	let attempts = 0;
  
	while (attempts < retries) {
	  try {
		const response = await apiCall();
		return response;
	  } catch (error) {
		if (error.statusCode === 502 && attempts < retries - 1) {
		  console.log('Encountered a 502 error. Retrying...');
		  attempts++;
		  await new Promise((resolve) => setTimeout(resolve, delay));
		} else {
		  throw error;
		}
	  }
	}
}

// TTS focused functions for the bot
// Merge parts of chunked TTS files
async function mergeAudioFiles(files, outputFile) {
    const currentDirectory = __dirname;
    const filterString = files.map((_, index) => `[${index}:0]`).join('');
    const inputFiles = files.map(file => `-i "${path.join(currentDirectory, file)}"`).join(' ');

    const outputFilePath = path.join(currentDirectory, outputFile);
    
    return new Promise((resolve, reject) => {
        exec(`${ffmpegPath} ${inputFiles} -filter_complex "${filterString}concat=n=${files.length}:v=0:a=1[out]" -map "[out]" "${outputFilePath}"`, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

// Generate TTS for message, if long split up and merge files first
async function textToSpeech(speaker, text) {
    const parts = splitMessage(text, 250);
    const audioFiles = await Promise.all(parts.map(async part => {
        const fileName = `${Date.now()}_${speaker}_tts`;
        await createAudioFromText(part, fileName, speaker);
        return fileName.replace('_tts', '_tts.mp3');
    }));

    if (audioFiles.length === 1) {
        return audioFiles[0];
    } else {
        const mergedFilename = `${Date.now()}_${speaker}_tts_merged.mp3`;
        await mergeAudioFiles(audioFiles, mergedFilename);

        // Clean up temporary audio files
        audioFiles.forEach(file => {
            fs.unlink(file, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        });

        return mergedFilename;
    }
}

module.exports = {
    isAdmin,
	isAdminInAdminId,
	isAdminInteraction,
    splitMessage,
	canProceed,
	disableCheck,
    sendCmdResp,
    mergeAudioFiles,
    textToSpeech,
    formatDate,
    callOpenAIWithRetry,
    getPersonality,
    initPersonalities,
    getPersonalityEmbed,
	checkTokens,
    chat
  };