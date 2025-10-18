// =====================================================
// 🔐 Middleware d'authentification Supabase
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware pour vérifier l'authentification
export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول للوصول إلى هذا المورد"
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Vérifier le token avec Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "جلسة غير صالحة أو منتهية الصلاحية"
      });
    }

    // Ajouter l'utilisateur au request pour utilisation ultérieure
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في التحقق من الهوية"
    });
  }
}

// Middleware pour vérifier que l'utilisateur est propriétaire de la ressource
export function ownershipMiddleware(userIdField = 'user_id') {
  return (req, res, next) => {
    const resourceUserId = req.body[userIdField] || req.params[userIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: "معرف المستخدم مطلوب"
      });
    }

    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول إلى هذا المورد"
      });
    }

    next();
  };
}
