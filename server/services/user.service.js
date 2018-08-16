const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const validateRegisterInput = require('../_helpers/validation/register');
const validateLoginInput = require('../_helpers/validation/login');

module.exports = {
    authenticate,
    getAll,
    getById,
    create,
    update,
    delete: _delete
};
 
async function authenticate(userLogin) {

    const { errors, isValid } = validateLoginInput(userLogin);
    if(!isValid) {
        console.log(errors);
        return errors;
    }

    const user = await User.findOne({ username: userLogin.username });
    if (user && bcrypt.compareSync(userLogin.password, user.password)) {
        const { password, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ sub: user.id }, config.secret);
        return {
            ...userWithoutHash,
            token
        };
    }
}
 
async function getAll() {
    return await User.find().select('-password');
}
 
async function getById(id) {
    return await User.findById(id).select('-password');
}
 
async function create(userParam) {
    // validate
    const { errors, isValid } = validateRegisterInput(userParam);

    if(!isValid) {
        return errors;
    }

    if (await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }
 
    const user = new User(userParam);
 
    // hash password
    if (userParam.password) {
        user.password = bcrypt.hashSync(userParam.password, 10);
    }
 
    // save user
    await user.save();
}
 
async function update(id, userParam) {
    const user = await User.findById(id);
 
    // validate
    if (!user) throw 'User not found';
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }
 
    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }
 
    // copy userParam properties to user
    Object.assign(user, userParam);
 
    await user.save();
}
 
async function _delete(id) {
    await User.findByIdAndRemove(id);
}