const User = require("../models/user-model");
const bcrypt = require("bcrypt");
const { createToken } = require("../utils/jwt");

async function signup(name, email, password) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    const token = createToken(user._id);

    return {
        user,
        token,
    };
}

async function login(email, password) {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    const token = createToken(user._id);

    return {
        user,
        token,
    };
}

module.exports = {
    signup,
    login,
};