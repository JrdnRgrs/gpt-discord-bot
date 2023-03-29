// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin, textToSpeech  } = require('../helpers');
const { voiceMapping, DISABLED_MSG } = require('../constants');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tts')
        .setDescription('Generates TTS for a message using the specified speaker.')
        .addStringOption(option =>
            option.setName('speaker')
                .setDescription('The speaker to use for TTS')
                .setRequired(true)
                .addChoices(
                    { name: 'us_male1', value: 'en_us_006' },
                    { name: 'us_male2', value: 'en_us_007' },
                    { name: 'us_male3', value: 'en_us_009' },
                    { name: 'us_male4', value: 'en_us_010' },
                    { name: 'us_female1', value: 'en_us_001' },
                    { name: 'uk_male1', value: 'en_uk_001' },
                    { name: 'rocket', value: 'en_us_rocket' },
                    { name: 'stitch', value: 'en_us_stitch' },
                    { name: 'stormtrooper', value: 'en_us_stormtrooper' },
                    { name: 'chewbacca', value: 'en_us_chewbacca' },
                    { name: 'ghostface', value: 'en_us_ghostface' },
                    { name: 'c3po', value: 'en_us_c3po' },
                    { name: 'alto', value: 'en_female_f08_salut_damour' },
                    { name: 'tenor', value: 'en_male_m03_lobby' },
                    { name: 'warmy_breeze', value: 'en_female_f08_warmy_breeze' },
                    { name: 'sunshine_soon', value: 'en_male_m03_sunshine_soon' },
                    { name: 'narrator', value: 'en_male_narration' },
                    { name: 'wacky', value: 'en_male_funny' },
                    { name: 'peaceful', value: 'en_female_emotional' },
                    { name: 'serious', value: 'en_male_cody' },
                    { name: 'pirate', value: 'en_male_pirate' },
                    { name: 'glorious', value: 'en_female_ht_f08_glorious' },
                    { name: 'funny_sing', value: 'en_male_sing_funny_it_goes_up' },
                    { name: 'chipmunk', value: 'en_male_m2_xhxs_m03_silly' },
                    { name: 'dramatic', value: 'en_female_ht_f08_wonderful_world' },
                ),
        )
        .addStringOption(option =>
            option.setName('text_or_message_id')
                .setDescription('The text or message ID to generate TTS')
                .setRequired(true)
        ),
    async execute(interaction, state) {
        // Check disabled status
        if (!isAdmin(interaction) && state.isPaused === true) {
            await interaction.reply(DISABLED_MSG);
            return;
        }

        let text = interaction.options.getString('text_or_message_id');

        if (text.length > 2 && !isNaN(text)) { // Check if the text argument is a message ID
            try {
                const fetchedMessage = await interaction.channel.messages.fetch(text);
                text = fetchedMessage.content;
            } catch (error) {
                console.error('Error fetching message by ID:', error);
                await interaction.reply("Invalid message ID. Please provide a valid message ID (from this channel) or text.");
                return;
            }
        }

        // Validate speaker
        // Create a reverse mapping object
        const reverseVoiceMapping = {};
        for (const key in voiceMapping) {
            reverseVoiceMapping[voiceMapping[key]] = key;
        }
        
        // Extract the speakerKey from the command
        const speakerKey = interaction.options.getString('speaker').toLowerCase();

        if (!reverseVoiceMapping.hasOwnProperty(speakerKey)) {
            await interaction.reply('Invalid speaker. Please use a valid speaker name.');
            return;
        }

        //const speaker = voiceMapping[speakerKey];
        const speaker = voiceMapping[reverseVoiceMapping[speakerKey]];

        const voiceRegex = /(?<=^[^_]+_[^_]+_).+/;
        const speaker_name = speaker.match(voiceRegex)
        try {
            const audioFilename = await textToSpeech(speaker, text);

            // Send the generated audio file to the Discord channel
            await interaction.reply({
                files: [{
                    attachment: audioFilename,
                    name: `${speaker_name}_tts.mp3`
                }]
            });

            // Remove the file after sending
            fs.unlink(audioFilename, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        } catch (error) {
            console.error(error);
            await interaction.reply('Error generating audio. Please try again later.');
            return;
        }
    },
};