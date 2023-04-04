// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TOKEN_RESET_MSG, TOKEN_NUM } = require('../constants');
// Initialize .env file
require('dotenv').config({ path: '/.env'});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('token-reset')
        .setDescription('Reset the token count.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addBooleanOption(option =>
            option
                .setName('show_count')
                .setDescription('Display the current token count.')
                .setRequired(false)
        )
        .setDMPermission(false),
    async execute(interaction, state) {
        // Reset the token count
        state.tokenCount = 0;
        await interaction.reply(TOKEN_RESET_MSG);
    },
};