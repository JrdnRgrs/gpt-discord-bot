// Requre the necessary discord.js classes
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { canProceed } = require('../helpers');
const { PERSONALITY_MSG, DISABLED_MSG } = require('../constants');

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('personalities')
        .setDescription('List the name of all personalities and their prompts.'),
    async execute(interaction, state) {
        // Check admin/pause state
        if (!(await canProceed(undefined, interaction, state)).result) {
            return;
        }
         // Create an embed object
        let persEmbed = new EmbedBuilder()
            .setColor(0x0099FF) // set the color of the embed
            .setTitle(PERSONALITY_MSG) // set the title of the embed
        
        // Add personality names and prompts to fields
        for (let i = 0; i < state.personalities.length; i++) {
            let thisPersonality = state.personalities[i];
            // Find the prompt from the request array
            let prompt = thisPersonality.request.find(item => item.role === 'system').content;
            // Truncate the prompt to 1024 characters if it's longer than that
            let truncatedPrompt = prompt.substring(0, 1024);
            persEmbed.addFields({ name: thisPersonality.name, value: truncatedPrompt });
        }
		// Send variable
		//interaction.reply(persMsg);
        interaction.reply({ embeds: [persEmbed] });
        
    },
};
