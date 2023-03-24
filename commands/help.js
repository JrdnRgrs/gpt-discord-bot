const { DISABLED_MSG, botCommand } = require('../constants');
const { sendCmdResp, isAdmin } = require('../helpers');
const { EmbedBuilder } = require('discord.js');

module.exports = function help(msg, client) {
    // Check disabled status
    if (client.isPaused === true && !isAdmin(msg)) {
        sendCmdResp(msg, DISABLED_MSG);
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
        { name:`${botCommand}help`,value:'Displays this help message.'}
    );

    // send the embed to the channel
    sendCmdResp(msg, { embeds: [helpEmbed] });
}
