// Requre the necessary discord.js classes
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { TOKEN_COUNT_MSG, TOKEN_NUM, TOKEN_RESET_TIME } = require('../constants');
const { isAdmin, canProceed } = require('../helpers');
// Initialize .env file
require('dotenv').config({ path: '/.env'});

// Create a discord embed for the voice descriptions (!speakers command)
function tokenEmbed(interaction, state) {
    // Calculate time passed
    //let timePassed = Math.abs(new Date() - state.timer);

    // Calculate time left
    //let timeLeft = Math.round((parseInt(TOKEN_RESET_TIME, 10) - timePassed) / 60000 * 10) / 10;
    if (state.timer === null) {
        state.timer = new Date();
    }
    // Calculate time passed
    let timePassed = (new Date() - state.timer) / 1000 / 60;

    // Calculate time left
    let timeLeft = Math.round((parseInt(TOKEN_RESET_TIME, 10) / 1000 / 60 - timePassed) * 10) / 10;

    const dateTimeString = state.startTime.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    let allowed_token;
    if(!TOKEN_NUM || parseInt(TOKEN_NUM, 10) === 0 ) {
        allowed_token = "∞";
    }else{
        allowed_token = TOKEN_NUM;
    }
    // create an embed object
    let embed = new EmbedBuilder()
        .setColor(0x0099FF) // set the color of the embed
        .setTitle('Token Count') // set the title of the embed
        .setDescription('User token count resets in: ' + timeLeft + ' minutes.') // set the description of the embed
        .setFooter({ text: 'Since ' + dateTimeString});
        embed.addFields(
            { name: `User Tokens`, value: state.nonAdminTokenCount.toString(), inline: true },
            { name: `User Token Limit`, value: allowed_token.toString(), inline: true },);
        if(isAdmin(interaction)){
            embed.addFields(
                { name: `Admin Tokens`, value: state.adminTokenCount.toString() },
                { name: `Total Tokens (prompt included)`, value: state.totalTokenCount.toString()}
            );
        }

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('token-count')
        .setDescription('Show amount of tokens used since bot was started.')
        .setDMPermission(false),
    async execute(interaction, state) {
        // Check admin/pause state
        if (!(await canProceed(undefined, interaction, state)).result) {
            return;
        }
        // Commands to execute
        let token_embed = tokenEmbed(interaction, state);
        await interaction.reply({ embeds: [token_embed] });
    },
};
