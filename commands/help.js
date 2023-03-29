// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { DISABLED_MSG, botCommand } = require('../constants');
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
            { name: `${botCommand}enable`, value: 'Enables the bot.' },
            { name: `${botCommand}disable`, value: 'Disables the bot.' },
            { name: `${botCommand}reset`, value: `Resets the memory of all personalities or a single personality. \n \`${botCommand}reset [all,<personality_name>]\`` },
            { name: `${botCommand}personality`, value: 'Displays all personalities and their prompts.' },
            { name: `${botCommand}tts`, value: `Generates TTS for a message. \n \`${botCommand}tts <speaker> [<text>,<messageID>] \`` },
            { name: `${botCommand}say`, value: `Generates TTS for a bot message. With no input, uses the last message with \`rocket\`. Both arguments are optional. \n \`${botCommand}say [<number>,<messageID>] <speaker>\`` },
            { name: `${botCommand}speakers`, value: `Displays all TTS speakers available to the \`${botCommand}tts\` command.` },
            { name: `${botCommand}sample`, value:`Listen to samples of each available speaker to the \`${botCommand}tts\` command. \n \`${botCommand}sample <speaker>\``},
            { name: `${botCommand}add-personality`, value:`Add a personality to the bot. \n \`${botCommand}add-personality <name> <prompt>\``},
            { name:`${botCommand}help`,value:'Displays this help message.'}
        );
        
		// Send variable
        interaction.reply({ embeds: [helpEmbed] });
        
    },
};