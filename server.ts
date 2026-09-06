import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Gemini
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  // --- API ROUTES ---

  // Generate AI message and trigger Webhook
  app.post('/api/links/trigger', async (req, res) => {
    try {
      const { id, title, amount, clientWa, description, ngrokUrl } = req.body;
      
      // Generate a professional WhatsApp message using Gemini
      let waMessage = `Halo! Ini adalah tagihan untuk ${title} sebesar Rp${amount}. Silakan bayar melalui link berikut: ${process.env.APP_URL || 'http://localhost:3000'}/pay/${id}`;
      
      if (ai) {
        try {
          const prompt = `Buatkan pesan WhatsApp penagihan/invoice yang profesional, sopan, dan ramah (Gunakan Bahasa Indonesia).
Detail pesanan:
- Layanan/Barang: ${title}
- Nominal: Rp${amount}
- Deskripsi: ${description}
- Link Pembayaran: ${process.env.APP_URL || 'http://localhost:3000'}/pay/${id}

Jangan tambahkan placeholder atau tanda kurung siku, langsung berikan teks pesannya saja yang siap dikirim.`;
          
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          
          if (response.text) {
            waMessage = response.text;
          }
        } catch (aiError) {
          console.error("Gemini AI error, using fallback message:", aiError);
        }
      }

      // TODO: Actually send the HTTP POST to the user's Ngrok Termux Baileys Endpoint
      let webhookStatus = 'success';
      if (ngrokUrl) {
        console.log(`[WEBHOOK MOCK] Sending to ${ngrokUrl}:`);
        console.log(`[WEBHOOK MOCK] Target WA: ${clientWa}`);
        console.log(`[WEBHOOK MOCK] Message: \n${waMessage}`);
        // In a real app we would do:
        // await fetch(ngrokUrl, { method: 'POST', body: JSON.stringify({ number: clientWa, message: waMessage }) })
      } else {
         webhookStatus = 'pending';
      }

      res.json({ success: true, message: waMessage, status: webhookStatus });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });


  // --- VITE MIDDLEWARE (DEV) OR STATIC FILES (PROD) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
