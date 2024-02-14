const { Collection } = require('discord.js');
const cooldowns = new Map();

module.exports = async (bot, interaction) => {
    if (interaction.isCommand()) {
        const command = bot.commands.get(interaction.commandName);
        if (!command) return;


        const options = interaction.options.data.map(option => {
            if (option.type === 'SUB_COMMAND' || option.type === 'SUB_COMMAND_GROUP') {
                const subOptions = option.options.map(subOption => `${subOption.name}: ${subOption.value}`).join(', ');
                return `${option.name} (${subOptions})`;
            } else {
                return `${option.name}: ${option.value}`;
            }
        }).join(', ');

        console.log('[Luna]'.blue, `Interaction: ${interaction.commandName} | Args: ${options} | User: ${interaction.user.tag} | Guild: ${interaction.guild.name} (${interaction.guild.id})`);

        try {
            await command.execute(interaction, bot);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Error occured during execution',
                ephemeral: true
            })
        }
    } else if (interaction.isButton()) {
        console.log('[Luna]'.blue, `Button: ${interaction.customId} | ${interaction.user.tag} | ${interaction.guild.name} (${interaction.guild.id})`);

        const button = (interaction.customId.includes("apply")) ? bot.buttons.get('apply') : bot.buttons.get(interaction.customId);
        if (!button) return;

        if (interaction.customId.includes("apply")) {

            if(!cooldowns.has(interaction.user.id)) {
                cooldowns.set(interaction.user.id, new Collection());
            }

            const current_time = Date.now();
            const timestamps = cooldowns.get(interaction.user.id);
            const cooldown = 30000;

            if(timestamps.has(interaction.user.id)) {
                const expiration_time = timestamps.get(interaction.user.id) + cooldown;

                if(current_time < expiration_time) {
                    const timeLeft = (expiration_time - current_time) / 1000;
                    return interaction.reply({content: `You have to wait ${timeLeft.toFixed(1)} more seconds.`, ephemeral: true});
                }
            }

            timestamps.set(interaction.user.id, current_time);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldown);

        }

        try {
            await button.execute(interaction, bot);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Error occured during execution',
                ephemeral: true
            })
        }
    } else if (interaction.isModalSubmit()) {
        console.log('[Luna]'.blue, `Modal: ${interaction.customId} | ${interaction.user.tag} | ${interaction.guild.name} (${interaction.guild.id})`);
    } else if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			return console.error(`No command matching ${interaction.commandName} was found.`);
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}
};