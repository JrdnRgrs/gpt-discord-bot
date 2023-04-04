// Requre the necessary discord.js classes
const { SlashCommandBuilder } = require('discord.js');
const { voiceMapping, DISABLED_MSG } = require('../constants');
const { canProceed } = require('../helpers');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('sample')
        .setDescription('Listen to a sample of one of the available speakers you can use with TTS functions.')
        .addStringOption( option =>
            option.setName('speaker')
                .setDescription('The speaker of which to listen to a sample of.')
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
        ),
    async execute(interaction, state) {
        // Check admin/pause state
        if (!(await canProceed(undefined, interaction, state)).result) {
            return;
        }
        
        // Create a reverse mapping object
        const reverseVoiceMapping = {};
        for (const key in voiceMapping) {
            reverseVoiceMapping[voiceMapping[key]] = key;
        }
        
        // Extract the speakerKey from the command
        const speakerKey = interaction.options.getString('speaker');

        // Check if the speakerKey is valid
        if (reverseVoiceMapping.hasOwnProperty(speakerKey)) {
            const speaker = voiceMapping[reverseVoiceMapping[speakerKey]];
            const audioFilePath = path.join(__dirname, `../voices/${speaker}.mp3`);

            // Check if the audio file exists
            fs.access(audioFilePath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error(err);
                    interaction.reply('Error: Sample audio file not found.');
                } else {
                    // Send the sample audio file to the Discord channel
                    interaction.reply({
                        files: [{
                            attachment: audioFilePath,
                            name: `${speaker}_tts.mp3`
                        }]
                    });
                    //const attachment = new MessageAttachment(audioFilePath, `${speaker}.mp3`);
                    //interaction.reply({ files: [attachment] });
                }
            });
        } else {
            interaction.reply('Invalid speaker. Please use a valid speaker name.');
        }
        
        
    },
};