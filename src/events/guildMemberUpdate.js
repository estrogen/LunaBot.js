const roleBlock = require('../models/dbv2/roleblock');
const cc = require('../../config.json');

module.exports = async (bot, oldMember, newMember) => {
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;
  const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));

  if (addedRoles.size > 0) {
    try {
      await preventBlockedRoles(oldMember, newMember, addedRoles);
    } catch (error) {
      console.error(`[RoleBlock Error]: ${error.message}`);
    }
  }


  if (!oldMember.roles.cache.has(cc.Roles.Identifier.Pending) && newMember.roles.cache.has(cc.Roles.Identifier.Pending)) {
    console.log('[Luna]'.blue, `Onboarding complete, ghost pinging user.`);
    try {
      const applyChannel = await bot.channels.cache.get(cc.Channels.WFEntrance);
      const msg = await applyChannel.send({ content: `<@${newMember.id}>` })
      await msg.delete();
    } catch (err) {
      console.error('[Error]'.red, err);
    }
  }
};

async function preventBlockedRoles(oldMember, newMember, addedRoles) {
  const roleBlockData = await roleBlock.find({});

  for (const roleData of roleBlockData) {
    if (oldMember.roles.cache.has(roleData.role)) {
      const blockedRolesToAdd = addedRoles.filter(role => roleData.blocked.includes(role.id));
      if (blockedRolesToAdd.size > 0) {
        await newMember.roles.remove(blockedRolesToAdd);
        console.log(`[RoleBlock] Blocked ${newMember.user.tag} from getting roles. Member ID: ${newMember.id}`);
        return;
      }
    }
  }
}