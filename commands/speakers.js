// Requre the necessary discord.js classes
const { SlashCommandBuilder } = require('discord.js');
const { voiceDescriptions, ne_voiceDescriptions, DISABLED_MSG } = require('../constants');
const { EmbedBuilder } = require('discord.js');
const { canProceed } = require('../helpers');

// merge voice names if multiple numbers. Outputs like us_male1,2,3,4
function groupVoiceDescriptions(voiceDescriptions) {
    const grouped = {};
    const regex = /^(.*\D)(\d+)$/;

    for (const key in voiceDescriptions) {
        const match = key.match(regex);
        if (match) {
            const prefix = match[1];
            const number = match[2];

            if (grouped[prefix]) {
                grouped[prefix].push(number);
            } else {
                grouped[prefix] = [number];
            }
        } else {
            grouped[key] = voiceDescriptions[key];
        }
    }

    const newVoiceDescriptions = {};
    for (const key in grouped) {
        if (Array.isArray(grouped[key])) {
            const newKey = `${key}${grouped[key].join('_')}`;
            newVoiceDescriptions[newKey] = voiceDescriptions[`${key}${grouped[key][0]}`];
        } else {
            newVoiceDescriptions[key] = grouped[key];
        }
    }

    return newVoiceDescriptions;
}

// Create a discord embed for the voice descriptions (!speakers command)
function voiceEmbed(voiceDescriptions, title) {
	const formattedDescriptions = groupVoiceDescriptions(voiceDescriptions);
	// create an embed object
	let voiceEmbed = new EmbedBuilder()
		.setColor(0x0099FF) // set the color of the embed
		.setTitle(title) // set the title of the embed
		.setDescription('Here are the '+ title +' you can use'); // set the description of the embed

	// loop through your voiceDescriptions object and add fields to the embed
	for (let key in formattedDescriptions) {
		const formattedKey = key.replace(/(\d)_/g, '$1,');
		voiceEmbed.addFields({ name: formattedKey, value: formattedDescriptions[key], inline: true });
	}

	return voiceEmbed;
}

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('speakers')
        .setDescription('List of all the speakers you can use with TTS functions.')
        .addStringOption(option =>
            option.setName('language')
            .setDescription('Specify "all" to display all voices, including non-English speakers.')
            .setRequired(false)),
    async execute(interaction, state) {
        // Check admin/pause state
        if (!(await canProceed(undefined, interaction, state)).result) {
            return;
        }

        // Get the 'language' option value
        const languageOption = interaction.options.getString('language') || '';

        // Create and send English speakers embed
        let voiceEmbed_en = voiceEmbed(voiceDescriptions, 'English Speakers');
        await interaction.reply({ embeds: [voiceEmbed_en] });

        // If 'language' option is 'all', create and send Non-English speakers embed
        if (languageOption.toLowerCase() === 'all') {
            let voiceEmbed_ne = voiceEmbed(ne_voiceDescriptions, 'Non-English Speakers');
            interaction.followUp({ embeds: [voiceEmbed_ne] });
        }
    },
};
