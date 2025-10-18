import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { to, subject, message } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = await resend.emails.send({
      from: 'UGC Maroc <noreply@ugc-maroc.com>',
      to,
      subject,
      html: `<p>${message}</p>`
    });

    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
