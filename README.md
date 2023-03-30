# ChatGPT Discord Bot
A GPT powered Discord Bot built with NodeJS.


## Features
* Multiple Personality Support: Add multiple personalities and depending on how you call the bot, it will respond differently.
* Enable/Disable/Reset commands for admins.
* Memory: Bot will remember conversations until restarted or reset.
* Message splitter for longer messages that exceed 2000 characters
* TTS: Bot will generate TTS clips from messages using TikTok's TTS api.

## Dependencies
* nodejs
* npm
   * dotenv
   * discord.js
   * openai
   * tiktok-tts
   * ffmpeg-static
   * child_process
* [OpenAI API Key](https://platform.openai.com/account/api-keys)
* [Discord Application Bot](https://discord.com/developers/applications/)
* [TikTok SessionID](#get-tiktok-session-id)

## Setup/Installation
1. Create an [OpenAI API Key](https://platform.openai.com/account/api-keys). Copy the key somewhere for usage later.
2. Create a [Discord Application Bot](https://discord.com/developers/applications/). You can follow [this](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) tutorial. Copy the bot token somewhere for usage later.
3. Get your TikTok `sessonid`. See [below](#get-tiktok-session-id) for instructions.
5. Invite the bot to your server. You can follow [this](https://discordjs.guide/preparations/adding-your-bot-to-servers.html) tutorial.
6. Install [NodeJS](https://nodejs.org/) for your system. Refer to Google for installation based on OS.
7. Download Source Code from releases or clone this repo for dev build.
8. Run `npm ci` to install NPM dependencies.
9.  Copy `.env.example` to `.env` and add all previously mentioned required keys into `.env`. Add 1 or more personalities. Change other options to your liking.
10. Run node `deploy-commands.js` to deploy the bot's slash commands to discord.
11. Finally, run `npm start` or `node index.js` to run the bot.
12. **OPTIONAL** Run the bot in a container if you want to keep your bot active. See [below](#docker) for instructions.

## Usage
Once the server is started, simply send a message containing the personality name you put in the `.env` file and a question, comment, etc. and the bot will respond

**Note:** for both tts commands, options `speaker` or `speaker2` are available. `speaker` contains english speaking voices, and `speaker2` contains any remaining voices. You may **ONLY** specify **ONE** of these.
### Commands
- `/enable`: Enables the bot.
- `/disable`: Disables the bot.
- `/reset [all,<personality_name>]`: Resets the memory of all personalities or a single personality. If personality is ephemeral, sets its prompt to `undefined`.
- `/personality`: Displays all personalities and their prompts.
- `/add-personality <name> <prompt>`: Adds an ephemeral personality to the bot, it will be lost when the bot restarts. Can also update `undefined` prompts. 
- `/tts [<text>,<messageID>] <speaker>`: Generates TTS for given text or message ID. 
- `/say [<number>,<messageID>] <speaker>`: Generates TTS for a bot message `<number>` messages back or a message ID. With no input, uses the last message with `rocket`. Both arguments are optional.
- `/speakers`: Displays speakers available to the `/tts` and `/say` commands. Specify `all` to display extra and non-english voices as well.
- `/sample <speaker>`: Listen to samples of each available speaker to the `/tts` and `/say` commands.
- `/reload`: ***(Admins ONLY)*** Reload a command if the code for it has changed.
- `/help`: Displays a help message with all available commands. 
### Config Environment Variables

Use the following environment variables to configure certain features:
- `REPLY_MODE` - Whether or not bot should use Discord replies for messages.
- `BOT_REPLIES` - Whether or not bot should reply to other bots (but never itself).
- `EMBED_RESPONSE` - Whether or not to use embeds when responding (new features will be developed for true)
- `DEFAULT_TTS_SPEAKER` - Used when no speaker is specified in a TTS command

These env vars are dynamic based on the personality. Use "\<p>" as a placeholder for the personality name:
- `DYNAMIC_RESET_MSG` - Bot message for single personality reset.
- `DYNAMIC_TITLE_MSG` - Bot message for the title of embeds. Will be wrapped in \*\* \*\*.

Personalities:
- `personality_NAME_thumbnail` - The thumbnail for the bot embed picture, optional


## Screenshots

### Multiple Personalities

![Image of the bot](https://i.imgur.com/0VfYZDc.png)

[![Image of the bot](https://i.gyazo.com/e8ec6a8731779ef537f56de2c603ee3d.gif)](https://gyazo.com/e8ec6a8731779ef537f56de2c603ee3d)

## Get TikTok Session id 🍪
- Install [Cookie Editor extension](https://cookie-editor.cgagnier.ca) for your browser.
- Log in to [TikTok Web](https://tiktok.com)
- While on TikTok web, open the extension and look for ```sessionid```
- Copy the ```sessionid``` value. (It should be an alphanumeric value)

## Docker
- Ensure your `.env` file exists and is populated with the correct values.
- Run `docker build -t gpt-discord-bot .` to build the image.
- Run `docker-compose up -d` to create a stack. This will mount the .env file to `/app/.env` within the container.
- The compose file expects you to provide an additional environment variable to point at the location of the `.env` file to use. Either change this before running, or supply the following:
  - `PROJECT_PATH` - The full path of the directory your `.env` file is in
  - `ENV_NAME` - The name of your `.env` file. Leave blank if just `.env`

## Contributing
Feel free to fork this repo and submit pull requests for different features, fixes, and changes.
