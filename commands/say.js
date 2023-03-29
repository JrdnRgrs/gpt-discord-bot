// Requre the necessary discord.js classes
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin, textToSpeech  } = require('../helpers');
const { voiceMapping, DISABLED_MSG } = require('../constants');
const fs = require('fs');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Generates TTS for a bot message. Both arguments are optional.')
        .addStringOption(option =>
            option.setName('message_id_or_num_back')
                .setDescription('Message ID or number of messages back (default is 1)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('speaker_key')
                .setDescription('Speaker key for the TTS voice (default is "rocket")')
                .setRequired(false)
        ),
    async execute(interaction, state) {
        // Check admin/pause state
        if (!isAdmin(interaction) && state.isPaused === true) {
            await interaction.reply(DISABLED_MSG);
            return;
        }

        const messageIdOrNumBack = interaction.options.getString('message_id_or_num_back') || 1;
        const speakerKey = interaction.options.getString('speaker_key') || "default";
        
        // Rest of the command code
        const botMessages = Array.from(interaction.channel.messages.cache.filter(m => m.author.bot).values());

        let lastBotMessage = null;

        if (messageIdOrNumBack.toString().length > 2) { // Message ID
            try {
                lastBotMessage = await interaction.channel.messages.fetch(messageIdOrNumBack);
                if (!lastBotMessage.author.bot) {
                    lastBotMessage = null;
                }
            } catch (error) {
                console.error('Error fetching message by ID:', error);
            }
        } else { // Number of messages back
            const filteredBotMessages = botMessages.filter(m => m.attachments.size === 0);
            if (filteredBotMessages.length >= messageIdOrNumBack) {
                lastBotMessage = filteredBotMessages[filteredBotMessages.length - messageIdOrNumBack];
            }
        }

        if (lastBotMessage) {
            const messageContent = lastBotMessage.content.trim().replace(/^[^:]*:\s*/, '');
            const voice = voiceMapping[speakerKey];

            try {
                const audioFilename = await textToSpeech(voice, messageContent);

                await interaction.reply({
                    files: [{
                        attachment: audioFilename,
                        name: `${speakerKey}_tts.mp3`
                    }]
                });

                fs.unlink(audioFilename, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Error generating audio. Please try again later.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: "No valid bot message found.", ephemeral: true });
        }
    },
};