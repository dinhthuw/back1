const User = require('../users/user.model');
const jwt = require('jsonwebtoken');

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra xem có nhập email và password không
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu' });
        }

        // Tìm người dùng theo email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
        }

        // Kiểm tra mật khẩu
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
        }

        // Kiểm tra trạng thái tài khoản
        if (!user.isActive) {
            return res.status(401).json({ message: 'Tài khoản đã bị khóa' });
        }

        // Tạo token JWT
        const token = jwt.sign(
            { 
                id: user._id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET || '123456',
            { expiresIn: '24h' }
        );

        // Gửi phản hồi
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                address: user.address,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi khi đăng nhập' });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id, '-password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng' });
    }
}; 