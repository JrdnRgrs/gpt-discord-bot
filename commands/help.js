// Requre the necessary discord.js classes
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { canProceed } = require('../helpers');
const { DISABLED_MSG } = require('../constants');
const fs = require('fs');
const { resolve } = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('help')
        .setDescription('List of all the commands you can use with the bot.'),
    async execute(interaction, state) {
        // Check admin/pause state
        const proceedResult = await canProceed(undefined, interaction, state);
        if (!proceedResult.result) {
            return;
        }
        const isAdminUser = proceedResult.isAdmin;

        // Create an embed object
        let helpEmbed = new EmbedBuilder()
            .setColor(0x0099FF) // Set the color of the embed
            .setTitle('**Bot Commands**') // Set the title of the embed
            .setDescription('Here are some commands you can use'); // Set the description of the embed

        // Read the contents of the readme file
        const readmePath = resolve(__dirname, '../README.md');
        const readmeContents = fs.readFileSync(readmePath, 'utf-8');

        // Parse the contents of the file to generate the help message
        // From '### Commands' to the next '###'
        const commands = readmeContents.match(/### Commands([\s\S]*?)###/)[1].trim().split('\n');

        // Add fields to the embed for each command and its usage
        commands.forEach(command => {
            const [name, value] = command.split(':');

            // Check if the command is for admins only and if the user is an admin
            const isAdminCommand = value.includes('***(Admins ONLY)***');
            if (!isAdminCommand || (isAdminCommand && isAdminUser)) {
                // Remove the '- ' at the beginning of each line.
                helpEmbed.addFields({ name: name.trim().replace(/^- /g, ''), value: value.trim() });
            }
        });

        // Send variable
        interaction.reply({ embeds: [helpEmbed], ephemeral: true  });
    },
};