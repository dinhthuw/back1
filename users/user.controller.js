const User = require('./user.model');
const mongoose = require('mongoose');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        // Ensure only admins can access
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Chỉ quản trị viên mới có thể xem danh sách người dùng' });
        }
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng' });
    }
};

// Get single user
exports.getUserById = async (req, res) => {
    try {
        // Ensure only admins can access
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Chỉ quản trị viên mới có thể xem thông tin người dùng' });
        }
        // Validate ObjectId
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
        }
        const user = await User.findById(req.params.id, '-password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user by id error:', error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng' });
    }
};

// Create user
exports.createUser = async (req, res) => {
    try {
        // Ensure only admins can create users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Chỉ quản trị viên mới có thể tạo người dùng' });
        }
        const { username, email, password, name, role, address, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ? 'Email đã được sử dụng' : 'Tên người dùng đã được sử dụng'
            });
        }

        const user = new User({
            username,
            email,
            password,
            name,
            role: role || 'user',
            address,
            phone,
            isActive: true
        });

        await user.save();
        res.status(201).json({
            message: 'Tạo người dùng thành công',
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                address: user.address,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Lỗi khi tạo người dùng' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        // Ensure only admins can update users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Chỉ quản trị viên mới có thể cập nhật người dùng' });
        }
        // Validate ObjectId
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
        }
        const { username, email, password, name, role, isActive, address, phone } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Update fields
        if (username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Tên người dùng đã được sử dụng' });
            }
            user.username = username;
        }

        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Email đã được sử dụng' });
            }
            user.email = email;
        }

        if (password) {
            user.password = password; 
        }

        if (name) {
            user.name = name;
        }

        if (role) {
            user.role = role;
        }

        if (isActive !== undefined) {
            user.isActive = isActive;
        }

        if (address !== undefined) {
            user.address = address;
        }

        if (phone !== undefined) {
            user.phone = phone;
        }

        await user.save();
        res.json({
            message: 'Cập nhật thông tin người dùng thành công',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.isActive,
                address: user.address,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông tin người dùng' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        // Ensure only admins can delete users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Chỉ quản trị viên mới có thể xóa người dùng' });
        }
        // Validate ObjectId
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
        }
        // Prevent self-deletion
        if (req.user.id === req.params.id) {
            return res.status(400).json({ message: 'Không thể xóa tài khoản của chính bạn' });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json({ message: 'Người dùng đã được xóa vĩnh viễn', userId: req.params.id });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Lỗi khi xóa người dùng' });
    }
};