require('dotenv').config();
// Voice mappings
const voiceMapping = {
	default: 'en_us_rocket',
    rocket: 'en_us_rocket',
    au_female: 'en_au_001',
    au_male: 'en_au_002',
    uk_male1: 'en_uk_001',
    uk_male2: 'en_uk_003',
    us_female1: 'en_us_001',
    us_female2: 'en_us_002',
    us_male1: 'en_us_006',
    us_male2: 'en_us_007',
    us_male3: 'en_us_009',
    us_male4: 'en_us_010',
	alto: 'en_female_f08_salut_damour',
    tenor: 'en_male_m03_lobby',
    warmy_breeze: 'en_female_f08_warmy_breeze',
    sunshine_soon: 'en_male_m03_sunshine_soon',
    narrator: 'en_male_narration',
    wacky: 'en_male_funny',
    peaceful: 'en_female_emotional',
    serious: 'en_male_cody',
    pirate: 'en_male_pirate',
    glorious: 'en_female_ht_f08_glorious',
    funny_sing: 'en_male_sing_funny_it_goes_up',
    chipmunk: 'en_male_m2_xhxs_m03_silly',
    dramatic: 'en_female_ht_f08_wonderful_world',
	ghostface: 'en_us_ghostface',
    chewbacca: 'en_us_chewbacca',
    c3po: 'en_us_c3po',
    stitch: 'en_us_stitch',
    stormtrooper: 'en_us_stormtrooper',
    fr_male1: 'fr_001',
    fr_male2: 'fr_002',
    de_female: 'de_001',
    de_male: 'de_002',
    es_male: 'es_002',
    mx_male: 'es_mx_002',
    br_female1: 'br_001',
    br_female2: 'br_003',
    br_female3: 'br_004',
    br_male: 'br_005',
    id_female: 'id_001',
    jp_female1: 'jp_001',
    jp_female2: 'jp_003',
    jp_female3: 'jp_005',
    jp_male: 'jp_006',
    kr_male1: 'kr_002',
    kr_female: 'kr_003',
    kr_male2: 'kr_004'
};

// Voice descriptions
const voiceDescriptions = {
    au_female: 'English AU - Female',
    au_male: 'English AU - Male',
    uk_male1: 'English UK - Male 1',
    uk_male2: 'English UK - Male 2',
    us_female1: 'English US - Female 1',
    us_female2: 'English US - Female 2',
    us_male1: 'English US - Male 1',
    us_male2: 'English US - Male 2',
    us_male3: 'English US - Male 3',
    us_male4: 'English US - Male 4',
	alto: 'Alto',
    tenor: 'Tenor',
    warmy_breeze: 'Female',
    sunshine_soon: 'Male',
    narrator: 'Narrator',
    wacky: 'Wacky',
    peaceful: 'Female (UK)',
    serious: 'Male',
    pirate: 'Male',
    glorious: 'Female Singing',
    funny_sing: 'Rising Male Singing',
    chipmunk: 'High Pitched Singing',
    dramatic: 'Female Singing',
	ghostface: 'Ghost Face',
    chewbacca: 'Chewbacca',
    c3po: 'C3PO',
    stitch: 'Stitch',
    stormtrooper: 'Stormtrooper',
    rocket: 'Rocket (Guardians)'
};

// Non-English Voice descriptions
const ne_voiceDescriptions = {
    fr_male1: 'French - Male 1',
    fr_male2: 'French - Male 2',
    de_female: 'German - Female',
    de_male: 'German - Male',
    es_male: 'Spanish - Male',
    mx_male: 'Spanish MX - Male',
    br_female1: 'Portuguese BR - Female 1',
    br_female2: 'Portuguese BR - Female 2',
    br_female3: 'Portuguese BR - Female 3',
    br_male: 'Portuguese BR - Male',
    id_female: 'Indonesian - Female',
    jp_female1: 'Japanese - Female 1',
    jp_female2: 'Japanese - Female 2',
    jp_female3: 'Japanese - Female 3',
    jp_male: 'Japanese - Male',
    kr_male1: 'Korean - Male 1',
    kr_female: 'Korean - Female',
    kr_male2: 'Korean - Male 2'
};
// Setup const for sensitive env vars
const SESSION_ID = process.env.SESSION_ID;
const ADMIN_ID = process.env.ADMIN_ID;
// Setup const defaults for non-sensitive env vars
const modelName = process.env.GPT_MODEL ? process.env.GPT_MODEL : "gpt-3.5-turbo-0301";
const botCommand = process.env.BOT_COMMAND ? process.env.BOT_COMMAND : "!";
const BASE_URL = process.env.BASE_URL ? process.env.BASE_URL : 'https://api16-normal-c-useast1a.tiktokv.com/media/api/text/speech/invoke';
const DISABLED_MSG = process.env.DISABLED_MSG ? process.env.DISABLED_MSG : "Sorry, I am disabled.";
const COMMAND_PERM_MSG = process.env.COMMAND_PERM_MSG ? process.env.COMMAND_PERM_MSG : "Sorry, you don't have the permissions to use that command.";
const ENABLE_MSG = process.env.ENABLE_MSG ? process.env.ENABLE_MSG : "I am enabled.";
const DISABLE_MSG = process.env.DISABLE_MSG ? process.env.DISABLE_MSG : "I am disabled";
const RESET_MSG = process.env.RESET_MSG ? process.env.RESET_MSG : "I have been reset";
const DYNAMIC_RESET_MSG = process.env.DYNAMIC_RESET_MSG ? process.env.DYNAMIC_RESET_MSG : "<p> has been reset.";
const RESET_ERROR_MSG = process.env.RESET_ERROR_MSG ? process.env.RESET_ERROR_MSG : 'Invalid usage. Use "!reset all" or "!reset <personality_name>"';
const PERSONALITY_MSG = process.env.PERSONALITY_MSG ? process.env.PERSONALITY_MSG : 'Available Personalities:';
const CASE_MODE = process.env.CASE_MODE ? process.env.CASE_MODE : "";
const REPLY_MODE = process.env.REPLY_MODE ? process.env.REPLY_MODE : "false";
const BOT_REPLIES = process.env.BOT_REPLIES ? process.env.BOT_REPLIES : "false";

module.exports = {
    voiceMapping,
    voiceDescriptions,
    ne_voiceDescriptions,
    modelName,
    botCommand,
    BASE_URL,
    DISABLED_MSG,
    COMMAND_PERM_MSG,
    ENABLE_MSG,
    DISABLE_MSG,
    RESET_MSG,
    DYNAMIC_RESET_MSG,
    RESET_ERROR_MSG,
    PERSONALITY_MSG,
    CASE_MODE,
    REPLY_MODE,
    BOT_REPLIES,
    SESSION_ID,
    ADMIN_ID
  };