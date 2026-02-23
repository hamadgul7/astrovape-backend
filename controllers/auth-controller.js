const authService = require("../services/auth-service");

async function signup(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const result = await authService.signup(
            name,
            email,
            password
        );

        return res.status(201).json({
            message: "Signup successful",
            user: {
                name: result.user.name,
                email: result.user.email,
                role: result.user.role
            }  
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const result = await authService.login(
            email,
            password
        );

        return res.status(200).json({
            message: "Login successful",
            token: result.token,
            user: {
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
            },
        });
    } catch (error) {
        return res.status(401).json({
            message: error.message,
        });
    }
}

module.exports = {
    signup,
    login,
};