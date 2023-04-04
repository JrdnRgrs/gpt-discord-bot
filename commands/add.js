// Requre the necessary discord.js classes
const { SlashCommandBuilder } = require('discord.js');
const { canProceed } = require('../helpers');
const { DISABLED_MSG, UPDATE_PERSONALITY_MSG, UPDATE_PERS_ERROR_MSG, ADDED_PERSONALITY_MSG } = require('../constants');

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
                .setRequired(true))
        .setDMPermission(false),
    async execute(interaction, state) {
        // Commands to execute
        // Check admin/pause state
        if (!(await canProceed(undefined, interaction, state)).result) {
            return;
        }
        const name = interaction.options.getString('name');
        const prompt = interaction.options.getString('prompt');

        // Check if personality already exists
        const existingPersonality = state.personalities.find(p => p.name.toUpperCase() === name.toUpperCase());
        if (existingPersonality) {
            // If the existing prompt is undefined and a new prompt is provided, update it
            if (typeof existingPersonality.prompt === 'undefined' && prompt) {
                existingPersonality.prompt = prompt;
                existingPersonality.request = [{
                    "role": "system",
                    "content": `${prompt}`
                }];
                await interaction.reply(UPDATE_PERSONALITY_MSG.replace("<n>", name));
            } else {
                await interaction.reply(UPDATE_PERS_ERROR_MSG);
            }
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

        await interaction.reply(ADDED_PERSONALITY_MSG.replace("<n>", name));
    },
};