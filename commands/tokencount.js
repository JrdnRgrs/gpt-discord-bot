// Requre the necessary discord.js classes
const { SlashCommandBuilder } = require('discord.js');
const { TOKEN_COUNT_MSG, TOKEN_NUM } = require('../constants');
// Initialize .env file
require('dotenv').config({ path: '/.env'});

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('token-count')
        .setDescription('Show amount of tokens used since bot was started.')
        .setDMPermission(false),
    async execute(interaction, state) {
        // Commands to execute
        if(!TOKEN_NUM || parseInt(TOKEN_NUM, 10) === 0 ) {
            allowed_token = "∞";
        }else{
            allowed_token = TOKEN_NUM;
        }
        let message = TOKEN_COUNT_MSG.replace("<t>", state.totalTokenCount).replace("<tt>", allowed_token);
        message = message.replace("<d>", state.startTime.toLocaleDateString());
        await interaction.reply(message);
    },
};
