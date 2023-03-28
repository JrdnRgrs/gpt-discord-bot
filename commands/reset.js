// Require the necessary node classes
const path = require('node:path');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendCmdResp, isAdmin } = require('../helpers');
const { RESET_ERROR_MSG, RESET_MSG, DYNAMIC_RESET_MSG, DISABLED_MSG } = require('../constants');
// Require global functions
const { initPersonalities } = require(path.join(__dirname, "../common.js"));

// module.exports = function reset(msg, client, initPersonalities, personalities) {
//     // Check disabled status
//     if (client.isPaused === true && !isAdmin(msg)) {
//         sendCmdResp(msg, DISABLED_MSG);
//         return;
//     }
//     let cutMsg = msg.content.slice(7);
//     // Delete all memories if message is "!reset all"
//     if (cutMsg === 'all') {
//         initPersonalities();
//         sendCmdResp(msg, RESET_MSG);
//         return;
//     } else {
//         // Check what personality's memory to delete
//         for (let i = 0; i < personalities.length; i++) {
//             let thisPersonality = personalities[i];
//             if (cutMsg.toUpperCase().startsWith(thisPersonality.name.toUpperCase())) {
//                 let originalSystemMessage = thisPersonality.request.find(msg => msg.role === 'system');
//                 personalities[i] = { "name": thisPersonality.name, "request" : [originalSystemMessage]};
//                 sendCmdResp(msg, DYNAMIC_RESET_MSG.replace('<p>', thisPersonality.name));
//                 return;
//             }
//         }
//         // Return error if reset message does not match anything
//         sendCmdResp(msg, RESET_ERROR_MSG);
//         return;
//     }
// }

// Reset bot command
module.exports = {
    data: new SlashCommandBuilder()
        // Command details
        .setName('reset')
        .setDescription('Reset the memory of personalities.')
        .addStringOption( option =>
            option.setName('personality')
                .setDescription('The personality to delete the memory of or "all"')
                .setRequired(true)
        ),
    async execute(interaction, state) {
        // Commands to execute
        // Check admin/pause state
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) && state.isPaused === true) {
            await interaction.reply(DISABLED_MSG);
            return;
        }
        // Delete all memories if option is "all"
        if (interaction.options.getString('personality') === "all" ) {
            initPersonalities(state.personalities, process.env);
            await interaction.reply(RESET_MSG)
        } else {
            // Check what personality's memory to delete
            for (let i = 0; i < state.personalities.length; i++) {
				let thisPersonality = state.personalities[i];
				if (interaction.options.getString('personality').toUpperCase().startsWith(thisPersonality.name.toUpperCase())) {
					state.personalities[i] = { "name": thisPersonality.name, "request" : [{"role": "system", "content": `${process.env["personality." + thisPersonality.name]}`}]};
					await interaction.reply(DYNAMIC_RESET_MSG.replace('<p>', thisPersonality.name));
					return;
				}
			}
            // Return error if reset message does not match any personality
			await interaction.reply(RESET_ERROR_MSG);
        }
    },
};