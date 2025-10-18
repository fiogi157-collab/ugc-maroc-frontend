// =====================================================
// 🤖 Service DeepSeek V3.1 - IA en Arabe/Darija
// =====================================================

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    if (!this.apiKey) {
      console.error("⚠️ DEEPSEEK_API_KEY manquante dans les variables d'environnement");
    }
  }

  // Méthode générique pour appeler DeepSeek
  async callDeepSeek(systemPrompt, userMessage, temperature = 0.7) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          temperature: temperature,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DeepSeek API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("❌ Erreur DeepSeek:", error);
      throw error;
    }
  }

  // 1. مولد السكريبت - Générer un script vidéo UGC
  async generateScript(briefData) {
    const systemPrompt = `أنت مساعد ذكي متخصص فكتابة سكريبتات فيديو UGC للعلامات التجارية المغربية.
خصك تساعد المبدعين باش يكتبو سكريبتات احترافية و أصيلة بطريقة طبيعية و مقنعة.
استعمل مزيج بين العربية الفصحى و الدارجة المغربية باش يكون المحتوى قريب من الناس.

المحتوى ديالك خاصو يكون:
- طبيعي و مقنع (مشي إشهار صريح)
- فيه hook قوي فالبداية (3 ثواني الأولى)
- يبرز فوائد المنتج بطريقة ذكية
- عندو call-to-action واضح فالنهاية
- مناسب للمدة المطلوبة`;

    const userMessage = `ولي لي سكريبت فيديو UGC بهاد المعلومات:

العلامة التجارية: ${briefData.brandName || "غير محدد"}
المنتج/الخدمة: ${briefData.productName || "غير محدد"}
الفئة المستهدفة: ${briefData.targetAudience || "الجمهور المغربي"}
مدة الفيديو: ${briefData.duration || "30-60"} ثانية
النقاط الأساسية: ${briefData.keyPoints || "جودة، سعر مناسب، خدمة ممتازة"}
الأسلوب المطلوب: ${briefData.tone || "ودي وطبيعي"}

عطيني السكريبت كامل مع:
- Hook (البداية المثيرة)
- Body (المحتوى الرئيسي)
- CTA (الدعوة للعمل)`;

    return await this.callDeepSeek(systemPrompt, userMessage, 0.8);
  }

  // 2. اقتراحات المحتوى - Suggestions créatives
  async suggestContent(campaignData) {
    const systemPrompt = `أنت خبير فالتسويق الإبداعي و UGC للسوق المغربي.
خصك تقترح أفكار إبداعية و زوايا مختلفة باش يقدم المبدع المنتج بطريقة مميزة.
الأفكار ديالك خاصها تكون أصيلة و مناسبة للثقافة المغربية.
استعمل العربية و الدارجة بطريقة طبيعية.`;

    const userMessage = `عطيني 5 أفكار إبداعية لكامبين UGC:

العلامة التجارية: ${campaignData.brandName || "غير محدد"}
المنتج: ${campaignData.productName || "غير محدد"}
الهدف: ${campaignData.objective || "زيادة الوعي بالعلامة"}
الجمهور: ${campaignData.audience || "شباب مغاربة 18-35"}

كل فكرة خاصها تكون عندها:
- عنوان جذاب
- وصف الفكرة
- ليش هاد الفكرة غتكون فعالة`;

    return await this.callDeepSeek(systemPrompt, userMessage, 0.9);
  }

  // 3. تحليل الأداء - Prédire performance
  async predictPerformance(videoData) {
    const systemPrompt = `أنت محلل بيانات و خبير في تسويق UGC.
خصك تحلل الفيديوهات و تتوقع الأداء ديالهم بناء على معايير مختلفة.
عطي تقييم واقعي و موضوعي مع اقتراحات للتحسين.
استعمل لغة بسيطة و مفهومة (عربية + دارجة).`;

    const userMessage = `حلل هاد الفيديو و توقع الأداء ديالو:

عنوان الفيديو: ${videoData.title || "غير محدد"}
مدة الفيديو: ${videoData.duration || "غير محدد"} ثانية
نوع المحتوى: ${videoData.contentType || "review"}
جودة الإنتاج: ${videoData.quality || "متوسطة"}
وضوح الرسالة: ${videoData.messageClarity || "جيد"}
call-to-action: ${videoData.hasCTA ? "موجود" : "غير موجود"}

عطيني:
- توقع نسبة النجاح (من 100)
- نقاط القوة
- نقاط التحسين
- توصيات محددة`;

    return await this.callDeepSeek(systemPrompt, userMessage, 0.6);
  }

  // 4. مولد البريف - Générer brief de campagne
  async generateBrief(campaignInfo) {
    const systemPrompt = `أنت مدير تسويق محترف متخصص في حملات UGC.
خصك تكتب بريفات واضحة و شاملة للمبدعين باش يفهمو المطلوب منهم بالضبط.
البريف خاصو يكون مفصل و سهل الفهم.
استعمل العربية الواضحة مع لمسة من الدارجة المغربية.`;

    const userMessage = `ولي بريف كامل لحملة UGC:

اسم الحملة: ${campaignInfo.campaignName || "غير محدد"}
العلامة التجارية: ${campaignInfo.brandName || "غير محدد"}
المنتج/الخدمة: ${campaignInfo.productName || "غير محدد"}
الهدف: ${campaignInfo.goal || "زيادة المبيعات"}
الميزانية: ${campaignInfo.budget || "غير محدد"} درهم
المدة المطلوبة: ${campaignInfo.deadline || "غير محدد"}
الجمهور المستهدف: ${campaignInfo.targetAudience || "الجمهور المغربي"}

البريف خاصو يتضمن:
- نظرة عامة على الحملة
- المتطلبات الفنية (مدة، جودة، إلخ)
- النقاط الأساسية اللي خاص المبدع يركز عليها
- الأسلوب و التون المطلوب
- معايير القبول
- المكافأة و التسليم`;

    return await this.callDeepSeek(systemPrompt, userMessage, 0.7);
  }

  // 5. توصيات المبدعين - Matching créateurs/campagnes
  async matchCreators(campaignData, creatorsPool) {
    const systemPrompt = `أنت خبير فتحليل البيانات و matching بين المبدعين و الحملات الإعلانية.
خصك تحلل البيانات و تختار أحسن المبدعين للحملة بناء على التخصص، الأداء السابق، و التوافق.
عطي توصيات مدروسة و مبررة.
استعمل العربية و الدارجة بطريقة احترافية.`;

    const userMessage = `ساعدني نختار أحسن 5 مبدعين لهاد الكامبين:

الحملة:
- المنتج: ${campaignData.productName || "غير محدد"}
- الفئة: ${campaignData.category || "غير محدد"}
- الجمهور: ${campaignData.targetAudience || "عام"}
- الميزانية: ${campaignData.budget || "متوسطة"}

المبدعين المتاحين:
${creatorsPool.map((c, i) => 
  `${i + 1}. ${c.name} - التخصص: ${c.specialization || "عام"} - التقييم: ${c.rating || "N/A"}/5 - عدد الفيديوهات: ${c.videoCount || 0}`
).join('\n')}

رتب لي أحسن 5 مبدعين مع:
- السبب ديال الاختيار
- التوافق مع الحملة
- التوصيات للتعاون`;

    return await this.callDeepSeek(systemPrompt, userMessage, 0.7);
  }
}

export default new DeepSeekService();
