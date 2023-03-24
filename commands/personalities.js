const { sendCmdResp, isAdmin } = require('../helpers');
const { PERSONALITY_MSG, DISABLED_MSG } = require('../constants');
const { EmbedBuilder } = require('discord.js');


module.exports = function personalitiesCommand(msg, client, personalities) {
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