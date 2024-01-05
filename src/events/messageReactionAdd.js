module.exports = async (bot, messageReaction, user) => {
    rulesChannelID = '719988173534396488'

    if(messageReaction.message.channelId == rulesChannelID && !user.bot){
        pendingRoleID = '572246269989355550'
        guestRoleID = '1031398048158453760'

        messageReaction.message.guild.members.fetch(user.id)
            .then((member) => {
                if (member.roles.cache.has(pendingRoleID)){
                    member.roles.add(guestRoleID);
                    member.roles.remove(pendingRoleID);
                } else if (member.roles.cache.has(guestRoleID)) {
                    member.roles.remove(member.roles.cache.filter(r => r.name!='━━━━━ 𝘼𝙗𝙤𝙪𝙩 𝙈𝙚 ━━━━━' && r.name!='━━━ 𝙎𝙚𝙡𝙛 𝘼𝙨𝙨𝙞𝙜𝙣𝙚𝙙 𝙍𝙤𝙡𝙚𝙨 ━━━'));
                    member.roles.add(pendingRoleID);
                }
            })
            .catch( (error) => {
                console.log('[Crescent]'.blue, error)
            })

    }
};