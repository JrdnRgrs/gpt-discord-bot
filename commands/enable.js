const { ENABLE_MSG, COMMAND_PERM_MSG } = require('../constants');
const { sendCmdResp, isAdmin } = require('../helpers');

module.exports = function enable(msg, client) {
    if (isAdmin(msg)) {
        client.isPaused = false;
        sendCmdResp(msg, ENABLE_MSG);
    } else {
        sendCmdResp(msg, COMMAND_PERM_MSG);
    }
}
