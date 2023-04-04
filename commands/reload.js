const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin,formatDate } = require('../helpers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addStringOption(option =>
			option.setName('command')
				.setDescription('The command to reload.')
				.setRequired(true))
        .setDMPermission(false),
	async execute(interaction) {
        // Commands to execute
        // Check admin state
        if (!isAdmin(interaction, true)) {
            await interaction.reply("Only bot admins can run this command.");
            return;
        }
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		if (!command) {
			return interaction.reply(`There is no command with name \`${commandName}\`!`);
		}

        delete require.cache[require.resolve(`./${command.data.name}.js`)];
        try {
            interaction.client.commands.delete(command.data.name);
            const newCommand = require(`./${command.data.name}.js`);
            interaction.client.commands.set(newCommand.data.name, newCommand);
            console.log(`[${formatDate(new Date())}] ${interaction.user.username}#${interaction.user.discriminator} reloaded: /${newCommand.data.name}`);
            await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
        } catch (error) {
            console.error(error);
            await interaction.reply(`There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``);
        }
	},
};