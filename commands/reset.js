const { sendCmdResp, isAdmin } = require('../helpers');
const { RESET_ERROR_MSG, RESET_MSG, DYNAMIC_RESET_MSG, DISABLED_MSG } = require('../constants');


module.exports = function reset(msg, client, initPersonalities, personalities) {
    // Check disabled status
    if (client.isPaused === true && !isAdmin(msg)) {
        sendCmdResp(msg, DISABLED_MSG);
        return;
    }
    let cutMsg = msg.content.slice(7);
    // Delete all memories if message is "!reset all"
    if (cutMsg === 'all') {
        initPersonalities();
        sendCmdResp(msg, RESET_MSG);
        return;
    } else {
        // Check what personality's memory to delete
        for (let i = 0; i < personalities.length; i++) {
            let thisPersonality = personalities[i];
            if (cutMsg.toUpperCase().startsWith(thisPersonality.name.toUpperCase())) {
                let originalSystemMessage = thisPersonality.request.find(msg => msg.role === 'system');
                personalities[i] = { "name": thisPersonality.name, "request" : [originalSystemMessage]};
                sendCmdResp(msg, DYNAMIC_RESET_MSG.replace('<p>', thisPersonality.name));
                return;
            }
        }
        // Return error if reset message does not match anything
        sendCmdResp(msg, RESET_ERROR_MSG);
        return;
    }
}