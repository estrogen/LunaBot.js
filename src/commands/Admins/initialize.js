const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('initialize')
        .setDescription('Allows ally to initialize some important things')
        .addStringOption(option => 
            option.setName('embed')
            .setDescription('Which embed youll be setting')
            .setRequired(true)
            .addChoices(
                {name: 'Welcome Embed', value: 'we'},
                {name: 'Parse Test', value: 'pe'}
            ))
        .setDefaultPermission(false),
   
    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Admin.includes(r.id)))
            return i.reply({ content: "You're not a admin", ephemeral: true});

        const option = i.options.getString('embed');
        i.reply({ content: "Embed getting created!", ephemeral: true});
        switch (option) {
            case 'we':
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('applyWarframe')
                            .setLabel('Here for Warframe')
                            .setStyle(ButtonStyle.Success),
                    );

                const embed = new EmbedBuilder()
                    .setTitle("‿︵‿︵‿︵‿︵‿୨♡ Entrance ♡୧‿︵‿︵‿︵‿︵‿")
                    .setColor("#ff7ba3")
                    .setDescription("Welcome to **Anime Kingdom** :cherry_blossom:\nWe are a **private** Warframe community!\nIf you would like to join this community you have **two** options.")
                    .addFields([
                        { name: "Applying to join the warframe clan.", value: "Do you play Warframe? Do you want to join a clan full of anime lovers? Then Anime Kingdom is the place for you, simply hit the green button under this message to start an application, after the application is done you will be contacted by a recruiter. (Make sure you have enable server DMs on)", inline: false}, 
                        { name: "The guest system.", value: "Do you not play Warframe but still would like to be inside of the community? Well you can! We have a guest system which allows those not inside of the Warframe clan to join the community, simply hit the red button under this message and follow instructions in new channels!", inline: false},
                        { name: "Event Guest System", value: "If you were invited to participate in an event please press the {color} button below this message. You will need to answer a few questions before you can join the server. Once you join, you will be able to enjoy all our events! Have fun and welcome to our community!"}
                    ])
                    .setImage(i.guild.bannerURL({ dynamic: true, format: "png", size: 2048}))
                i.channel.send({ embeds: [embed], components: [row] });
                break;

            case 'pe':
                const management = {
                    "890240560319856720" : "890240560542134274", //Recruiter Team : Recruiter Manager
                    "890240560319856711" : "890240560496017476" //Treasury Team : Treasury Manager
                }
                
                const parse = i.member.roles.cache.filter(r => cc.Roles.Staff.includes(r.id));
                const teams = parse.map(r => `${r.name},`).join(" ");
                const managers = parse.map(r => `<@&${management[r.id]}>`).join(" ");
                const msg = await i.channel.send({ content: `${managers}` })
                const notify = new EmbedBuilder()
                    .setTitle("Department Notices")
                    .setDescription(`${i.member.tag} has left the server | ${i.member.id}\n\n**Affected teams:** ${teams}`)
                await msg.edit({ content: `\u200B`, embeds: [notify] });
                break;
        }
    },
};