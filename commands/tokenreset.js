// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TOKEN_RESET_MSG, TOKEN_NUM } = require('../constants');
// Initialize .env file
require('dotenv').config({ path: '/.env'});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tokenreset')
        .setDescription('Reset the token count.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addBooleanOption(option =>
            option
                .setName('show_count')
                .setDescription('Display the current token count.')
                .setRequired(false)
        ),
    async execute(interaction, state) {
        const showCount = interaction.options.getBoolean('show_count');
        let allowed_token;
        if(!TOKEN_NUM || parseInt(TOKEN_NUM, 10) === 0 ) {
            allowed_token = "∞";
        }else{
            allowed_token = TOKEN_NUM;
        }
        if (showCount) {
            // Display the current token count
            await interaction.reply(`Current token count: ${state.tokenCount} of ${allowed_token}`);
        } else {
            // Reset the token count
            state.tokenCount = 0;
            await interaction.reply(TOKEN_RESET_MSG);
        }
    },
};