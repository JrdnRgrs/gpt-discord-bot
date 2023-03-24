const { sendCmdResp, isAdmin, textToSpeech,  } = require('../helpers');
const { voiceMapping, DISABLED_MSG } = require('../constants');
const fs = require('fs');



module.exports = async function say(msg, client) {
    // Check disabled status
    if (client.isPaused === true && !isAdmin(msg)) {
        sendCmdResp(msg, DISABLED_MSG);
        return;
    }
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
            return;
        }
    } else {
        msg.reply("No valid bot message found.");
        return;
    }
}