// Global functions file
const { BASE_URL, REPLY_MODE, SESSION_ID, ADMIN_ID, DYNAMIC_TITLE_MSG} = require('./constants');
// Require TikTok TTS package and store sessionID and URL
const { config, createAudioFromText } = require('tiktok-tts');
//const BASE_URL = process.env.BASE_URL;
config(SESSION_ID, BASE_URL);
const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
// Require ffmpeg, fs, path, child_process for working with audio files
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');

// General functions for the bot
// Set admin user IDs
const adminId = ADMIN_ID.split(',');
// Check message author id function
function isAdmin(interaction, msg) {
	//if (msg.member.permissions.has(PermissionFlagsBits.Administrator) || msg.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    if (msg) {
        if (msg.member.permissions.has(PermissionFlagsBits.Administrator) || msg.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return true;
        } else {
            return adminId.includes(msg.author.id);
        }
    } else if (interaction) {
        if (interaction.member.permissions.has(PermissionFlagsBits.Administrator) || interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return true;
        } else {
            return adminId.includes(interaction.user.id);
        }
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

// Send command responses function
function sendCmdResp(msg, cmdResp) {
    if (REPLY_MODE === 'true') {
        msg.reply(cmdResp);
    } else {
        msg.channel.send(cmdResp);
    }
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
    splitMessage,
    sendCmdResp,
    mergeAudioFiles,
    textToSpeech,
    formatDate,
    callOpenAIWithRetry,
    getPersonality,
    initPersonalities,
    getPersonalityEmbed
  };