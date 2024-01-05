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