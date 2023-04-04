// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { TOKEN_RESET_MSG, TOKEN_NUM } = require('../constants');
const { isAdmin, formatDate, isAdminInteraction, isAdminInAdminId } = require('../helpers');
// Initialize .env file
require('dotenv').config({ path: '/.env'});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('token-reset')
        .setDescription('Reset the token count.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    async execute(interaction, state) {
        if (!isAdminInAdminId(interaction.user.id)) {
            await interaction.reply("Only bot admins can run this command.");
            return;
        }
        // Reset the token count
        state.tokenCount = 0;
        state.nonAdminTokenCount = 0;
        state.adminTokenCount = 0;
        console.log(`[${formatDate(new Date())}] Token Count was reset by: ${interaction.user.username}#${interaction.user.discriminator}`);
        await interaction.reply(TOKEN_RESET_MSG);
    },
};