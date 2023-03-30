// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin, textToSpeech  } = require('../helpers');
const { voiceMapping, DISABLED_MSG, DEFAULT_TTS_SPEAKER } = require('../constants');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tts')
        .setDescription('Generates TTS for a message using the specified speaker.')
        .addStringOption(option =>
            option.setName('text_or_message_id')
                .setDescription('The text or message ID to generate TTS')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('speaker')
                .setDescription('The speaker to use for TTS')
                .setRequired(false)
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
            option.setName('speaker2')
                .setDescription('Extra speakers to use for TTS')
                .setRequired(false)
                .addChoices(
                    { name: 'au_female', value: 'en_au_001' },
                    { name: 'au_male', value: 'en_au_002' },
                    { name: 'uk_male2', value: 'en_uk_003' },
                    { name: 'us_female2', value: 'en_us_002' },
                    { name: 'fr_male1', value: 'fr_001' },
                    { name: 'fr_male2', value: 'fr_002' },
                    { name: 'de_female', value: 'de_001' },
                    { name: 'de_male', value: 'de_002' },
                    { name: 'es_male', value: 'es_002' },
                    { name: 'mx_male', value: 'es_mx_002' },
                    { name: 'br_female1', value: 'br_001' },
                    { name: 'br_female2', value: 'br_003' },
                    { name: 'br_female3', value: 'br_004' },
                    { name: 'br_male', value: 'br_005' },
                    { name: 'id_female', value: 'id_001' },
                    { name: 'jp_female1', value: 'jp_001' },
                    { name: 'jp_female2', value: 'jp_003' },
                    { name: 'jp_female3', value: 'jp_005' },
                    { name: 'jp_male', value: 'jp_006' },
                    { name: 'kr_male1', value: 'kr_002' },
                    { name: 'kr_female', value: 'kr_003' },
                    { name: 'kr_male2', value: 'kr_004' },
                ),
        ),
    async execute(interaction, state) {
        // Check disabled status
        if (!isAdmin(interaction) && state.isPaused === true) {
            await interaction.reply(DISABLED_MSG);
            return;
        }
        // Initialize and check the text 
        let text = interaction.options.getString('text_or_message_id');
        if (text.length > 2 && !isNaN(text)) { // Check if the text argument is a message ID
            try {
                const fetchedMessage = await interaction.channel.messages.fetch(text);
                if (fetchedMessage.embeds.length > 0 && fetchedMessage.embeds[0].description) {
                    text = fetchedMessage.embeds[0].description;
                } else {
                    await interaction.reply("The message with the provided ID does not contain an embed with a description. Please provide a valid message ID (from this channel) or text.");
                    return;
                }
            } catch (error) {
                console.error('Error fetching message by ID:', error);
                await interaction.reply("Invalid message ID. Please provide a valid message ID (from this channel) or text.");
                return;
            }
        }

        // Check which speaker option was used
        const speakerOption = interaction.options.getString('speaker');
        const speaker2Option = interaction.options.getString('speaker2');
        // Validate that only one speaker option was used
        // if ((speakerOption && speaker2Option) || (!speakerOption && !speaker2Option)) {
        //     await interaction.reply('Please provide either a "speaker" or "speaker2" option, but not both.');
        //     return;
        // }
        // Set the speakerKey based on which option was used
        // if 1 doesnt exist set it to 2, if neither set it to 'en_us_rocket'
        const speakerKey = speakerOption ? speakerOption.toLowerCase() : (speaker2Option ? speaker2Option.toLowerCase() : DEFAULT_TTS_SPEAKER);

        // Validate speaker
        // Create a reverse mapping object
        const reverseVoiceMapping = {};
        for (const key in voiceMapping) {
            reverseVoiceMapping[voiceMapping[key]] = key;
        }
        // Invalidate if the speakerkey is not in the mapping
        if (!reverseVoiceMapping.hasOwnProperty(speakerKey)) {
            await interaction.reply('Invalid speaker. Please use a valid speaker name.');
            return;
        }

        // Set speaker var to mapping match from speakerkey
        const speaker = voiceMapping[reverseVoiceMapping[speakerKey]];

        // Determine filename based on speaker
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