const { DISABLE_MSG, COMMAND_PERM_MSG } = require('../constants');
const { sendCmdResp, isAdmin } = require('../helpers');

module.exports = function disable(msg, client) {
    if (isAdmin(msg)) {
        client.isPaused = true;
        sendCmdResp(msg, DISABLE_MSG);
    } else {
        sendCmdResp(msg, COMMAND_PERM_MSG);
    }
}