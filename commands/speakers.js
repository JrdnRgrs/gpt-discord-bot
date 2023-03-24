const { DISABLED_MSG, voiceDescriptions, ne_voiceDescriptions } = require('../constants');
const { sendCmdResp, isAdmin } = require('../helpers');
const { EmbedBuilder } = require('discord.js');

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

module.exports = function speakers(msg, client) {
    // Check disabled status
    if (client.isPaused === true && !isAdmin(msg)) {
        sendCmdResp(msg, DISABLED_MSG);
        return;
    }
    const [, ne_voices] = msg.content.split(' ')
    let voiceEmbed_en = voiceEmbed(voiceDescriptions, 'English Speakers')
    // send the embed to the channel
    sendCmdResp(msg, { embeds: [voiceEmbed_en] });

    if(ne_voices == "all"){
        let voiceEmbed_ne = voiceEmbed(ne_voiceDescriptions, 'Non-English Speakers')
        // send the embed to the channel
        sendCmdResp(msg, { embeds: [voiceEmbed_ne] });
    }
}
