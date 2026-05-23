import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Allow larger payload sizes to comfortably handle Base64 image uploads from Admin
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Initialize Gemini API client on server-side
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoint for AI generating product details
  app.post("/api/gemini/generate-product", async (req, res) => {
    try {
      const { textInput } = req.body;
      if (!textInput || !textInput.trim()) {
        return res.status(400).json({ error: "الرجاء إدخال اسم فكرة الهاتف أو المنتج أولاً لتوليد البيانات." });
      }

      console.log("Analyzing product with Gemini for query: ", textInput);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `قم بتوليد بيانات تفصيلية وحقيقية وكاملة باللغة العربية لهاتف أو منتج يسمى "${textInput}" لعرضه في متجر الجحفلي للهواتف المعتمد بصنعاء، اليمن.
ملاحظة: السعر يجب أن يكون سعر منطقي بالعملة اليمنية ريال يمني (ر.ي) لأسعار صنعاء الحالية (مثلاً الهواتف الذكية تتراوح من 100000 إلى 1500000 ر.ي حسب الفخامة والروعة والموديل)، وقرب الأرقام لأقرب ألف مثل 550000 أو 280000.
إذا كانت فكرة المنتج خيالية أو لم تصدر بعد (مثلاً S32 Ultra أو iPhone 18) فقم بتوقع المواصفات والميزات والسعر بشكل جذاب ومقنع جداً وممتاز ومحترف كأنه حقيقي صدر بالفعل ومقارب للتوقعات التكنولوجية!`,
        config: {
          systemInstruction: `أنت خبير محترف في كتابة مواصفات الأجهزة الذكية والإلكترونيات للتسويق والمبيعات في اليمن. تولد مخرجات هيكلية دقيقة وفق واجهة برمجية JSON.
القيم المسموحة للحقل category:
- 'smartphones': للهواتف الذكية الجديدة والمجددة الفخمة (مثل s32 ultra, iphone 16)
- 'used_devices': للأجهزة المستعملة
- 'electronics': للأجهزة الإلكترونية الأخرى والساعات الذكية
- 'accessories': للإكسسوارات والسماعات والشواحن
- 'recharge_cards': لبطاقات شحن رصيد وباقات سوبر يمن موبايل، سبأفون، يو
القيم المسموحة للحقل brand:
- Apple, Samsung, Xiaomi, Oppo, Realme, Infinix, Tecno, Yemen Mobile, SabaFon, YOU, Other.
يجب أن يكون الحقل specs عبارة عن مصفوفة من نصوص مستقلة تصف الخصائص الفنية الفريدة باللغة العربية (3 إلى 6 مواصفات مفصلة وجذابة).
حقل description هو فقرة تسويقية متكاملة باللغة العربية (30 إلى 70 كلمة) تصف ميزات الهاتف وقيمته للمستخدم في اليمن.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The name of the product in English, e.g., Samsung Galaxy S32 Ultra" },
              arabicName: { type: Type.STRING, description: "Descriptive name of the product in Arabic, e.g., سامسونج جالكسي S32 الترا - الجيل الخامس" },
              category: { type: Type.STRING, description: "One of specific keys: 'smartphones', 'used_devices', 'electronics', 'accessories', 'recharge_cards'" },
              brand: { type: Type.STRING, description: "Specific manufacturer brand, one of Apple, Samsung, Xiaomi, Oppo, Realme, Infinix, Tecno" },
              price: { type: Type.INTEGER, description: "Appropriate selling price in Yemeni Rials YER, rounded to nearest 1000" },
              originalPrice: { type: Type.INTEGER, description: "A higher fake original price for fake previous pricing, YER, rounded to nearest 1000" },
              description: { type: Type.STRING, description: "An engaging descriptive marketing text in Arabic about the key highlights of the phone" },
              specs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of specifications in Arabic, each specifying a particular hardware detail"
              }
            },
            required: ["name", "arabicName", "category", "brand", "price", "description", "specs"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("لم تنجح عملية التوليد من الذكاء الاصطناعي");
      }

      console.log("Gemini successfully generated: ", responseText);
      const data = JSON.parse(responseText.trim());
      res.json(data);
    } catch (error: any) {
      console.error("Gemini Generation Error: ", error);
      res.status(500).json({ error: error.message || "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي، يرجى المحاولة لاحقاً." });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
