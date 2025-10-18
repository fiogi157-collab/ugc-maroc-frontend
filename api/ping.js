export default function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: "✅ API connectée avec succès !",
    timestamp: new Date().toISOString(),
  });
}
