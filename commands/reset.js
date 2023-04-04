// Require the necessary node classes
const { SlashCommandBuilder } = require('discord.js');
const { disableCheck, initPersonalities } = require('../helpers');
const { RESET_ERROR_MSG, RESET_MSG, DYNAMIC_RESET_MSG, DISABLED_MSG } = require('../constants');

// Reset bot command
module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('reset')
        .setDescription('Reset the memory of personalities.')
        .addStringOption( option =>
            option.setName('personality')
                .setDescription('The personality to delete the memory of or "all"')
                .setRequired(true)
        )
        .setDMPermission(false),
    async execute(interaction, state) {
        // Check admin/pause state
        if (!await disableCheck(interaction, state, DISABLED_MSG)) {
            return;
        }
        // Delete all memories if option is "all"
        if (interaction.options.getString('personality') === "all" ) {
            initPersonalities(state.personalities, process.env);
            await interaction.reply(RESET_MSG)
        } else {
            // Check what personality's memory to delete
            for (let i = 0; i < state.personalities.length; i++) {
				let thisPersonality = state.personalities[i];
				if (interaction.options.getString('personality').toUpperCase().startsWith(thisPersonality.name.toUpperCase())) {
					state.personalities[i] = { "name": thisPersonality.name, "request" : [{"role": "system", "content": `${process.env["personality_" + thisPersonality.name]}`}]};
					await interaction.reply(DYNAMIC_RESET_MSG.replace('<p>', thisPersonality.name));
					return;
				}
			}
            // Return error if reset message does not match any personality
			await interaction.reply(RESET_ERROR_MSG);
        }
    },
};