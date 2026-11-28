/**
 * @file src/modules/policies/helpers.ts
 * @purpose Isolated Policies constants and cleanly separated initial documents (returns, shipping, privacy, terms, faq, contact).
 */

import type { PoliciesRegistry } from "./schema";

export const POLICIES_PAGE_KEY = "__isolated_policies_v1__";
export const POLICIES_RECORD_ID = "pol_isolated_registry_v1";
export const POLICIES_LOCAL_STORAGE_KEY = "room_isolated_policies_v1";

export function buildInitialPoliciesRegistry(): PoliciesRegistry {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    updatedAt: now,
    documents: {
      returns: {
        slug: "returns",
        titleAr: "سياسة الاستبدال والاسترجاع",
        titleEn: "Returns & Exchanges Policy",
        subtitleAr: "حقك الكامل في المعاينة والاستبدال بكل وضوح وشفافية.",
        subtitleEn: "Clear 14-day exchange and return guidelines for every order.",
        updatedLabel: "2026-11",
        isPublished: true,
        sections: [
          {
            id: "ret_1",
            titleAr: "المدة المسموح بها للاستبدال أو الاسترجاع",
            bodyAr: "يمكنك طلب الاستبدال أو الاسترجاع خلال 14 يوماً من تاريخ الاستلام طالما كان المنتج في حالته الأصلية وبكامل تغليفه غير مستخدم.",
            titleEn: "14-Day Eligibility Window",
            bodyEn: "Items may be exchanged or returned within 14 days of delivery in unused original packaging.",
          },
          {
            id: "ret_2",
            titleAr: "المعاينة عند الاستلام وعيوب الصناعة",
            bodyAr: "لك الحق في معاينة الطلب قبل الدفع للمندوب. في حالة وجود أي خطأ في المقاس أو عيب تصنيع، نتحمل كامل مصاريف الشحن للاستبدال الفوري.",
            titleEn: "Courier Inspection & Manufacturing Defects",
            bodyEn: "Inspect upon delivery; zero shipping fee for replacements caused by defects or wrong items.",
          },
        ],
      },
      shipping: {
        slug: "shipping",
        titleAr: "سياسة الشحن والتوصيل",
        titleEn: "Shipping & Delivery Policy",
        subtitleAr: "تغطية مناطق القاهرة والجيزة والمدن الجديدة بأسرع جدول تسليم.",
        subtitleEn: "Express dispatch timelines, coverage zones, and free shipping rules.",
        updatedLabel: "2026-11",
        isPublished: true,
        sections: [
          {
            id: "shp_1",
            titleAr: "مواعيد التجهيز والتسليم",
            bodyAr: "يتم تأكيد الطلبات وتجهيزها يومياً، ويستغرق التوصيل داخل القاهرة والقاهرة الجديدة من يوم إلى يومي عمل بحسب المنطقة المختارة في السلة.",
            titleEn: "Processing & Delivery Lead Time",
            bodyEn: "Orders are processed daily; delivery takes 1–2 business days within Cairo & New Cairo zones.",
          },
          {
            id: "shp_2",
            titleAr: "الشحن المجاني والرسوم",
            bodyAr: "يتم احتساب تكلفة الشحن وحد الشحن المجاني تلقائياً داخل سلة المشتريات بناءً على منطقتك.",
            titleEn: "Dynamic Zone Rates & Free Thresholds",
            bodyEn: "Fees and free-shipping thresholds are automatically calculated per zone in My Room.",
          },
        ],
      },
      privacy: {
        slug: "privacy",
        titleAr: "سياسة الخصوصية وحماية البيانات",
        titleEn: "Privacy & Data Protection",
        subtitleAr: "كيف نجمع ونستخدم ونحمي بيانات طلباتك وتواصلك.",
        subtitleEn: "How your personal contact and address information is protected.",
        updatedLabel: "2026-11",
        isPublished: true,
        sections: [
          {
            id: "prv_1",
            titleAr: "البيانات التي نجمعها",
            bodyAr: "نستخدم فقط الاسم، رقم الهاتف، العنوان، ومنطقة التوصيل لإتمام شحن طلبك والتواصل معك لتأكيد الموعد.",
            titleEn: "Order Information Collected",
            bodyEn: "We collect only your name, phone, delivery address, and zone solely to fulfill your order.",
          },
          {
            id: "prv_2",
            titleAr: "عدم مشاركة البيانات",
            bodyAr: "لا نقوم ببيع أو مشاركة بياناتك مع أي أطراف تسويقية خارجية، وتُستخدم فقط مع شركة الشحن المختصة لتوصيل الطلب.",
            titleEn: "No Third-Party Selling",
            bodyEn: "Personal details are never sold and are only shared with the courier handling your shipment.",
          },
        ],
      },
      terms: {
        slug: "terms",
        titleAr: "الشروط والأحكام",
        titleEn: "Terms & Conditions",
        subtitleAr: "القواعد المنظمة للشراء والأسعار والكوبونات واستخدام المتجر.",
        subtitleEn: "Terms governing purchases, pricing, promo codes, and storefront usage.",
        updatedLabel: "2026-11",
        isPublished: true,
        sections: [
          {
            id: "trm_1",
            titleAr: "تأكيد الطلبات وتوافر المخزون",
            bodyAr: "تخضع جميع الطلبات لتوافر المخزون الفعلي، ويتم خصم الكمية لحظياً فور تأكيد الطلب وإصدار رقم الطلب.",
            titleEn: "Order Confirmation & Inventory",
            bodyEn: "All orders are subject to live stock availability and receive a unique order number upon confirmation.",
          },
          {
            id: "trm_2",
            titleAr: "أكواد الخصم والدفع",
            bodyAr: "يُطبق كود الخصم وقت إتمام الطلب قبل التأكيد النهائي ولا يمكن دمجه مع أكثر من كود للطلب الواحد.",
            titleEn: "Promo Codes & Payments",
            bodyEn: "One valid promo code may be applied per order prior to final submission.",
          },
        ],
      },
    },
    faq: {
      titleAr: "الأسئلة الشائعة",
      titleEn: "Frequently Asked Questions",
      subtitleAr: "إجابات مرتبة ومنفصلة لكل ما يخص الطلبات والشحن والمنتجات والدفع.",
      subtitleEn: "Categorized answers covering Orders, Shipping, Products, and Payments.",
      items: [
        {
          id: "faq_1",
          category: "orders",
          questionAr: "كيف أتأكد أن طلبي تم تسجيله بنجاح؟",
          answerAr: "بعد الضغط على تأكيد الطلب سيظهر لك رقم طلبك فوراً مثل #RM-... مع ملخص كامل وزر لإرساله مباشرة على واتساب المتجر.",
          questionEn: "How do I know my order is confirmed?",
          answerEn: "An #RM-... confirmation number appears immediately after checkout along with a WhatsApp summary option.",
          isActive: true,
          sortOrder: 1,
        },
        {
          id: "faq_2",
          category: "shipping",
          questionAr: "ما هي مدة التوصيل وتكلفته؟",
          answerAr: "التوصيل داخل مناطق القاهرة والقاهرة الجديدة يتم عادة خلال 1 إلى 2 يوم عمل، ويمكنك معرفة التكلفة وحد الشحن المجاني عند اختيار منطقتك داخل السلة.",
          questionEn: "How fast is delivery and how much does it cost?",
          answerEn: "Cairo & New Cairo express delivery takes 1–2 business days with live zone pricing shown inside My Room.",
          isActive: true,
          sortOrder: 2,
        },
        {
          id: "faq_3",
          category: "products",
          questionAr: "هل يمكن اختيار مقاس أو لون مختلف للمنتج؟",
          answerAr: "نعم، داخل صفحة أي منتج يدعم تعدد النسخ يمكنك اختيار اللون والمقاس المناسبين قبل الإضافة للسلة.",
          questionEn: "Can I choose a color or size variant?",
          answerEn: "Yes, select any available color swatch or size chip directly on the product page before adding to your bag.",
          isActive: true,
          sortOrder: 3,
        },
        {
          id: "faq_4",
          category: "payments",
          questionAr: "ما وسائل الدفع المتاحة حالياً؟",
          answerAr: "نوفر الدفع عند الاستلام (COD)، والتحويل عبر إنستاباي (InstaPay) أو المحافظ الإلكترونية برقم المرجع.",
          questionEn: "Which payment methods are supported?",
          answerEn: "Cash on Delivery (COD), InstaPay, and local mobile wallets are supported.",
          isActive: true,
          sortOrder: 4,
        },
      ],
    },
    contact: {
      titleAr: "من نحن وتواصل معنا",
      titleEn: "About & Contact Us",
      subtitleAr: "نحن هنا لمساعدتك قبل وبعد الطلب طوال أيام الأسبوع.",
      subtitleEn: "Reach our support team anytime for product questions or order help.",
      storyAr: "علامة متخصصة في تجهيز الغرف ذات الطابع الخاص بتفاصيل عالية الجودة وتجربة شراء سهلة وسريعة داخل مصر.",
      storyEn: "Specialized D2C studio crafting themed room essentials and curated loadouts.",
      workingHoursAr: "السبت إلى الخميس — من 10 صباحاً حتى 10 مساءً",
      workingHoursEn: "Sat–Thu • 10:00 AM – 10:00 PM EET",
      locationAr: "القاهرة / القاهرة الجديدة، مصر",
      locationEn: "Cairo & New Cairo, Egypt",
    },
  };
}
