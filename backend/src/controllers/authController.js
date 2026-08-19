import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'bookmyorder_super_secret_jwt_key_2026_skip_the_queue', {
    expiresIn: '30d',
  });
};

// @desc    Request Mobile OTP
// @route   POST /api/auth/request-otp
export const requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Mobile phone number is required' });
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone, activeOtp: { code: otpCode, expiresAt } });
    } else {
      user.activeOtp = { code: otpCode, expiresAt };
    }
    await user.save();

    res.json({
      success: true,
      message: `OTP sent successfully to +91 ${phone}`,
      simulatedOtp: otpCode, // Provided for user convenience during testing
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP and Login/Register Customer/Provider
// @route   POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name, city, role } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please request OTP first.' });
    }

    // Allow 1234 or actual generated OTP for easy testing
    if (otp !== '1234' && (!user.activeOtp || user.activeOtp.code !== otp)) {
      return res.status(400).json({ message: 'Invalid OTP code. Use 1234 or the generated code.' });
    }

    if (name) user.name = name;
    if (city) user.city = city;
    if (role && ['customer', 'provider', 'admin'].includes(role)) user.role = role;
    user.activeOtp = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        city: user.city,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified || false,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Super Admin Email & Password Login
// @route   POST /api/auth/admin-login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || 'support.bookmyorder.online@gmail.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin.bookmyorder@123';

    if (email !== adminEmail || password !== adminPass) {
      return res.status(401).json({ message: 'Invalid Super Admin credentials' });
    }

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        phone: '9999999999',
        name: 'Platform Super Admin',
        email: adminEmail,
        role: 'admin',
        city: 'Global',
        isEmailVerified: true,
      });
    }

    const token = generateToken(adminUser._id);
    res.json({
      success: true,
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        isEmailVerified: adminUser.isEmailVerified || true,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Current Logged in User Profile
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc    Update User Profile (Name, City, Avatar, Email)
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, city, avatar, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (city) user.city = city;
    if (avatar) user.avatar = avatar;
    if (email && email !== user.email) {
      user.email = email;
      user.isEmailVerified = false; // Reset verification if email changes
    }

    await user.save();
    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request Email OTP
// @route   POST /api/auth/request-email-otp
export const requestEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetEmail = email || user.email;
    if (!targetEmail) {
      return res.status(400).json({ message: 'Email address is required for verification' });
    }

    user.email = targetEmail;

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.emailOtp = { code: otpCode, expiresAt };
    await user.save();

    res.json({
      success: true,
      message: `6-Digit Email Verification OTP sent to ${targetEmail}`,
      simulatedOtp: otpCode, // Provided for user convenience during testing
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-email-otp
export const verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!otp) {
      return res.status(400).json({ message: 'OTP code is required' });
    }

    // Allow 123456 or actual generated OTP for easy testing
    if (otp !== '123456' && (!user.emailOtp || user.emailOtp.code !== otp)) {
      return res.status(400).json({ message: 'Invalid 6-digit Email OTP code. Use 123456 or generated OTP.' });
    }

    user.isEmailVerified = true;
    user.emailOtp = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email address verified successfully! Blue verified badge unlocked.',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
