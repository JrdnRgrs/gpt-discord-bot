// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../helpers');
const { DISABLED_MSG,  } = require('../constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-personality')
        .setDescription('Add a new personality to the bot.')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the new personality.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The prompt for the new personality.')
                .setRequired(true)),
    async execute(interaction, state) {
        // Commands to execute
        // Check admin/pause state
        if (!isAdmin(interaction) && state.isPaused === true) {
            await interaction.reply(DISABLED_MSG);
            return;
        }
        const name = interaction.options.getString('name');
        const prompt = interaction.options.getString('prompt');

        // Check if personality already exists
        const existingPersonality = state.personalities.find(p => p.name.toUpperCase() === name.toUpperCase());
        if (existingPersonality) {
            await interaction.reply('A personality with this name already exists. Please choose a different name.');
            return;
        }

        // Add the new personality
        state.personalities.push({
            name: name,
            prompt: prompt,
            request: [{
                "role": "system",
                "content": `${prompt}`
            }]
        });

        await interaction.reply(`New personality "${name}" added.`);
    },
};