const { DISABLED_MSG, voiceMapping } = require('../constants');
const { sendCmdResp, isAdmin } = require('../helpers');
const fs = require('fs');
const path = require('path');

module.exports = function sample(msg, client) {
    // Check disabled status
    if (client.isPaused === true && !isAdmin(msg)) {
        sendCmdResp(msg, DISABLED_MSG);
        return;
    }
    // Extract the speakerKey from the command
    const [, speakerKey] = msg.content.split(' ');
    
    // Check if the speakerKey is valid
    if (voiceMapping.hasOwnProperty(speakerKey)) {
        const speaker = voiceMapping[speakerKey];
        const audioFilePath = path.join(__dirname, `../voices/${speaker}.mp3`);

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
