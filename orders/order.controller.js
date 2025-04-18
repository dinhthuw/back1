const Order = require("./order.model");
const jwt = require('jsonwebtoken');

const createAOrder = async (req, res) => {
  try {
    // Kiểm tra xem có token không
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy token xác thực" });
    }

    // Lấy thông tin user từ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '123456');
    const userId = decoded.id;

    // Tạo order mới với dữ liệu từ request và thêm userId
    const orderData = {
      ...req.body,
      user: userId
    };
    
    // Đảm bảo paymentMethod được cung cấp
    if (!orderData.paymentMethod) {
      orderData.paymentMethod = 'cod'; // Mặc định là thanh toán khi nhận hàng
    }
    
    // Thiết lập paymentStatus dựa trên phương thức thanh toán
    if (orderData.paymentMethod === 'cod') {
      orderData.paymentStatus = 'pending';
    } else if (orderData.paymentDetails && orderData.paymentDetails.transactionId) {
      orderData.paymentStatus = 'paid';
    } else {
      orderData.paymentStatus = 'pending';
    }
    
    const newOrder = new Order(orderData);
    
    // Lưu order vào database
    const savedOrder = await newOrder.save();
    
    // Trả về order đã lưu
    res.status(201).json({
      message: "Đặt hàng thành công",
      order: savedOrder
    });
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Token không hợp lệ",
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: "Không thể tạo đơn hàng",
      error: error.message 
    });
  }
};

const getOrderByEmail = async (req, res) => {
  try {
    const {email} = req.params;
    const orders = await Order.find({email})
      .populate('products.product')
      .sort({createdAt: -1});
    if(!orders) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    res.status(200).json(orders);
  } catch (error) {
    console.error("Lỗi khi lấy đơn hàng", error);
    res.status(500).json({ message: "Không thể lấy đơn hàng" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('products.product')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng", error);
    res.status(500).json({ message: "Không thể lấy danh sách đơn hàng" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('products.product');
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng", error);
    res.status(500).json({ message: "Không thể lấy thông tin đơn hàng" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng", error);
    res.status(500).json({ message: "Không thể cập nhật trạng thái đơn hàng" });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentDetails } = req.body;
    
    const updateData = { paymentStatus };
    if (paymentDetails) {
      updateData.paymentDetails = paymentDetails;
    }
    
    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái thanh toán", error);
    res.status(500).json({ message: "Không thể cập nhật trạng thái thanh toán" });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    
    res.status(200).json({ message: "Xóa đơn hàng thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa đơn hàng", error);
    res.status(500).json({ message: "Không thể xóa đơn hàng" });
  }
};

module.exports = {
  createAOrder,
  getOrderByEmail,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder
};
