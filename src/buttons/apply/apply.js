const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonStyle } = require('discord.js');
const apps = require('../../models/guild/applications');
const applyDb = require("../../models/guild/apply");

module.exports = {
    data: {
        name: 'apply'
    },
    async execute(i, bot) {
        try {
            const applicationData = await apps.findOne({ name: i.customId });
            const applicationChannel = await i.guild.channels.cache.get(applicationData.output);

            const modal = new ModalBuilder()
                .setCustomId(`${i.customId}-${i.user.id}`)
                .setTitle(`${applicationData.description}`);
            
            applicationData.questions.forEach((question, index) => {
                const actionRow = new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(`${index}-question-${i.customId}`)
                        .setLabel(`Question ${index + 1}`)
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder(question)
                );
                modal.addComponents(actionRow);
            });

            await i.showModal(modal);

            const filter = (int) => int.customId === `${i.customId}-${i.user.id}`;
            const modalInteraction = await i.awaitModalSubmit({ filter, time: 1_200_000 });

            const welcomeBtns = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId("deleteMessage").setLabel("Delete Message").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('recruitment').setLabel('Recruit User').setStyle(ButtonStyle.Success),
                );

            const clanApplication = new EmbedBuilder()
                .setTitle("Application")
                .setColor("#ffb347")
                .setTimestamp()
                .setFooter({ text: `${i.member.id} | ${i.user.tag}` });

            applicationData.questions.forEach((question, index) => {
                const modalValue = modalInteraction.fields.getTextInputValue(`${index}-question-${i.customId}`);
                clanApplication.addFields({ name: question, value: modalValue });
            });

            await modalInteraction.reply({ embeds: [clanApplication], ephemeral: true });
            if (i.customId === 'applyWarframe') {
                await applicationChannel.send({ embeds: [clanApplication], components: [welcomeBtns] });
            } else {
                await applicationChannel.send({ embeds: [clanApplication] });
            }
        } catch (err) {
            console.error('[Error]'.red, err);
            if (i.deferred || i.replied) {
                await i.followUp({ content: 'An error occurred while processing your application.', ephemeral: true }).catch(console.error);
            } else {
                await i.reply({ content: 'An error occurred while processing your application.', ephemeral: true }).catch(console.error);
            }
        }
    },
};
