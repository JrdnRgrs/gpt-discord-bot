const { Events } = require('discord.js');
const { splitMessage, sendCmdResp, checkTokens, formatDate, callOpenAIWithRetry, getPersonality, getPersonalityEmbed, chat } = require('../helpers');
const { BOT_REPLIES, EMBED_RESPONSE, MSG_LIMIT } = require('../constants');

module.exports = {
	name: Events.MessageCreate,
	async execute(msg, state, openai) {
		// Don't do anything when message is from self or bot depending on config
        if (BOT_REPLIES === 'true') {
            if (msg.author.id === client.user.id) return;
        } else {
            if (msg.author.bot) return;
        }

        // Run get personality from message function
        p = getPersonality(msg.content.toUpperCase(),state);
        // Check if message is a reply if no personality name
        if (p == null && msg.reference?.messageId) {
			let refMsg = await msg.fetchReference();
			if (refMsg.author.id === client.user.id) {
				p = state.personalities.find(pers => pers.request.some(element => (element.content === refMsg.content)));
			}
		}
		if (p == null) return;

		// Check permissions and tokens
		const permissionCheckResult = await checkTokens(msg, state);
		if (!permissionCheckResult.result) {
			return;
		}

		// Check if it is a new month
		let today = new Date();
		if (state.startTime.getUTCMonth() !== today.getUTCMonth()) {
			state.startTime = new Date();
			state.totalTokenCount = 0;
		}

		// Handle image input
		let contentWithImage = [];
		if (msg.attachments.size > 0) {
			msg.attachments.forEach(attachment => {
				if (attachment.contentType && attachment.contentType.startsWith('image/')) {
					contentWithImage.push({
						"type": "image_url",
						"image_url": {
							"url": attachment.proxyURL
						}
					});
				}
			});
		}

		// Add user message to the request
		if (contentWithImage.length > 0) {
			contentWithImage.unshift({
				"type": "text",
				"text": `${msg.content}`
			});
			p.request.push({ "role": "user", "content": contentWithImage });
		} else {
			p.request.push({ "role": "user", "content": `${msg.content}` });
		}
        try {
            // Start typing indicator
            msg.channel.sendTyping();
            console.log(`[${formatDate(new Date())}] Making API request...`);

            // Run API request function
            //const response = await chat(p.request);
            const response = await callOpenAIWithRetry(() => chat(p.request, msg, state, openai), 3, 5000);
            console.log(`[${formatDate(new Date())}] Received API response.`);
            // Split response if it exceeds the Discord 2000 character limit
            const responseChunks = splitMessage(response, 2000)
            // Send the split API response
            for (let i = 0; i < responseChunks.length; i++) {
                let full_msg;
                if (EMBED_RESPONSE) {
                    const isSplit = responseChunks.length > 1 && i > 0;
                    const msgEmbed = getPersonalityEmbed(p, responseChunks[i], msg.author, isSplit);
                    full_msg = {embeds: [msgEmbed]};
                } else {
                    full_msg = responseChunks[i];
                }
                sendCmdResp(msg, full_msg, i === 0);
            }
        } catch (error) {
            console.error(`[${formatDate(new Date())}] Message processing failed:`, error);
            return;
        }
	},
};