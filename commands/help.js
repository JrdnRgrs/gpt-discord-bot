// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { DISABLED_MSG } = require('../constants');
const { isAdmin } = require('../helpers');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('help')
        .setDescription('List of all the commands you can use with the bot.'),
    async execute(interaction, state) {
        // Commands to execute
        // Check admin/pause state
        if (!isAdmin(interaction) && state.isPaused === true) {
            await interaction.reply(DISABLED_MSG);
            return;
        }
        // create an embed object
        let helpEmbed = new EmbedBuilder()
            .setColor(0x0099FF) // set the color of the embed
            .setTitle('**Bot Commands**') // set the title of the embed
            .setDescription('Here are some commands you can use'); // set the description of the embed

        // add fields to the embed for each command and its usage
        helpEmbed.addFields(
            { name: `/enable`, value: 'Enables the bot.' },
            { name: `/disable`, value: 'Disables the bot.' },
            { name: `/reset`, value: `Resets the memory of all personalities or a single personality. \n \`/reset [all,<personality_name>]\`` },
            { name: `/personality`, value: 'Displays all personalities and their prompts.' },
            { name: `/tts`, value: `Generates TTS for a message. \n \`/tts [<text>,<messageID>] <speaker>\`` },
            { name: `/say`, value: `Generates TTS for a bot message. With no input, uses the last message with \`rocket\`. Both arguments are optional. \n \`/say [<number>,<messageID>] <speaker>\`` },
            { name: `/speakers`, value: `Displays all TTS speakers available to the \`/tts\` command.` },
            { name: `/sample`, value:`Listen to samples of each available speaker to the \`/tts\` command. \n \`/sample <speaker>\``},
            { name: `/add-personality`, value:`Add a personality to the bot. \n \`/add-personality <name> <prompt>\``},
            { name: `/help`, value:'Displays this help message.'}
        );
        
		// Send variable
        interaction.reply({ embeds: [helpEmbed] });
        
    },
};