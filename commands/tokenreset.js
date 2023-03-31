// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TOKEN_RESET_MSG } = require('../constants');
// Initialize .env file
require('dotenv').config({ path: '/.env'});

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('tokenreset')
        .setDescription('Reset the token count.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction, state) {
        // Commands to execute
        state.tokenCount = 0;
        await interaction.reply(TOKEN_RESET_MSG);
    },
};