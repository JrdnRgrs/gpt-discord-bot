const { sendCmdResp, isAdmin, textToSpeech,  } = require('../helpers');
const { voiceMapping, DISABLED_MSG } = require('../constants');
const fs = require('fs');

module.exports = async function tts(msg, client) {
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
        return;
    }
}