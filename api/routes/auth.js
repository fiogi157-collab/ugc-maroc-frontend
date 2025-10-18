import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('⚠️ Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =====================================================
// 🔐 LOGIN - تسجيل الدخول
// =====================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
      });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: data.user,
        session: data.session,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول'
    });
  }
});

// =====================================================
// 📝 SIGNUP - إنشاء حساب
// =====================================================
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور والدور مطلوبون'
      });
    }

    // Validate role
    if (!['creator', 'brand'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'دور غير صالح'
      });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
          role
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      
      if (error.message.includes('already registered')) {
        return res.status(400).json({
          success: false,
          message: 'هذا البريد الإلكتروني مسجل بالفعل'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'فشل إنشاء الحساب'
      });
    }

    // Create profile in profiles table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          email,
          full_name: full_name || '',
          phone: phone || '',
          role,
          status: 'pending'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      // Create wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: data.user.id,
          balance_mad: 0,
          total_earned: 0,
          total_withdrawn: 0
        });

      if (walletError) {
        console.error('Wallet creation error:', walletError);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني.',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الحساب'
    });
  }
});

// =====================================================
// 🔑 RESET PASSWORD - إعادة تعيين كلمة المرور
// =====================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب'
      });
    }

    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/auth/reset-password-confirm.html`
    });

    if (error) {
      console.error('Password reset error:', error);
      return res.status(400).json({
        success: false,
        message: 'فشل إرسال بريد إعادة التعيين'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور'
    });
  }
});

// =====================================================
// ✅ VERIFY EMAIL - التحقق من البريد الإلكتروني
// =====================================================
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحقق مطلوب'
      });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email'
    });

    if (error) {
      console.error('Email verification error:', error);
      return res.status(400).json({
        success: false,
        message: 'فشل التحقق من البريد الإلكتروني'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم التحقق من البريد الإلكتروني بنجاح',
      data
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق'
    });
  }
});

// =====================================================
// 🚪 LOGOUT - تسجيل الخروج
// =====================================================
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return res.status(400).json({
        success: false,
        message: 'فشل تسجيل الخروج'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الخروج'
    });
  }
});

export default router;
