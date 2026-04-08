import * as authService from './auth.service.js';
export const register = async (req, res) => {
    try {
        const admin = await authService.registerAdmin(req.body);
        res.status(201).json({ message: "Admin registered successfully", adminId: admin.id });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await authService.loginAdmin(email, password);
        res.json({ message: "Login successful", token: result.token });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
export const profile = async (req, res) => {
    try {
        const admin = await authService.getAdminProfile(req.user.id);
        res.json(admin);
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};
//# sourceMappingURL=auth.controller.js.map