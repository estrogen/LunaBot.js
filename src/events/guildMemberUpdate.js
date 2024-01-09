const roleBlock = require('../models/guild/roleblock');

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


  if (!oldMember.roles.cache.has("1193605190759227392") && newMember.roles.cache.has("1193605190759227392")) {
    console.log('[Luna]'.blue, `Onboarding complete, ghost pinging user.`);
    try {
      const applyChannel = await bot.channels.cache.get("1193605095296876605");
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