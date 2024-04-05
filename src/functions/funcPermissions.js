const cc = require('../../config.json');

function checkPermission(user, minPermission){

    switch(minPermission){
        case "Recruiter":
            if((user.roles.cache.some(r => Object.values(cc.Roles.Admin).includes(r.id))) ||
            (user.roles.cache.some(r => cc.Roles.Managers.RecruiterManager == r.id)) ||
            (user.roles.cache.some(r => cc.Roles.Staff.Recruiter == r.id))){
                return true;
            }
            else{
                break;
            }
        case "Sage":
            if((user.roles.cache.some(r => Object.values(cc.Roles.Admin).includes(r.id))) ||
            (user.roles.cache.some(r => Object.values(cc.Roles.Managers).includes(r.id))) ||
            (user.roles.cache.some(r => cc.Roles.Staff.Sage == r.id))){
                return true;
            }
            else{
                break;
            }
        case "Staff":
            if((user.roles.cache.some(r => Object.values(cc.Roles.Admin).includes(r.id))) ||
            (user.roles.cache.some(r => Object.values(cc.Roles.Managers).includes(r.id))) ||
            (user.roles.cache.some(r => Object.values(cc.Roles.Staff).includes(r.id)))){
                return true;
            }
            else{
                break;
            }
        case "Manager":
            if((user.roles.cache.some(r => Object.values(cc.Roles.Admin).includes(r.id))) ||
            (user.roles.cache.some(r => Object.values(cc.Roles.Managers).includes(r.id)))){
                return true;
            }
            else{
                break;
            }
        case "Admin":
            if((user.roles.cache.some(r => Object.values(cc.Roles.Admin).includes(r.id)))){
                return true;
            }
            else{
                break;
            }
        default:
            break;

    }
    
    return false;
}

module.exports = checkPermission;