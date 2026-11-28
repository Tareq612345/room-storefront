/**
 * @file src/modules/policies/components/PoliciesOrganizerClient.tsx
 * @purpose Dedicated Isolated Admin Studio (/admin/policies/): cleanly edit each separated Policy document, FAQ items, and Contact page details inside __isolated_policies_v1__.
 */

"use client";

import { generateClientId } from "@shared/utils/client-auth";
import {
  ArrowLeft,
  Check,
  Database,
  ExternalLink,
  FileText,
  HelpCircle,
  Phone,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchPoliciesSnapshot,
  saveIsolatedPoliciesRegistry,
} from "../client-api";
import { buildInitialPoliciesRegistry } from "../helpers";
import type { FaqEntry, PoliciesRegistry, PolicyKey } from "../schema";

type EditorSection = PolicyKey | "faq" | "contact";

export function PoliciesOrganizerClient() {
  const [storeId, setStoreId] = useState("store_room_egypt");
  const [registry, setRegistry] = useState<PoliciesRegistry>(() =>
    buildInitialPoliciesRegistry()
  );
  const [activeTab, setActiveTab] = useState<EditorSection>("returns");
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const snap = await fetchPoliciesSnapshot();
      if (!active) return;
      setStoreId(snap.storeId);
      setRegistry(snap.registry);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveIsolatedPoliciesRegistry({ storeId, registry });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  const tabs: Array<{ id: EditorSection; label: string; route: string }> = [
    { id: "returns", label: "الاستبدال والاسترجاع", route: "/policies/returns/" },
    { id: "shipping", label: "سياسة الشحن", route: "/policies/shipping/" },
    { id: "privacy", label: "الخصوصية", route: "/policies/privacy/" },
    { id: "terms", label: "الشروط والأحكام", route: "/policies/terms/" },
    { id: "faq", label: "الأسئلة الشائعة", route: "/faq/" },
    { id: "contact", label: "من نحن وتواصل معنا", route: "/contact/" },
  ];

  const currentRoute = tabs.find((t) => t.id === activeTab)?.route ?? "/faq/";

  return (
    <div dir="rtl" className="min-h-screen bg-[#040308] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070510]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/15"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>لوحة الإدارة</span>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/10">
              <FileText className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h1 className="font-serif text-base font-semibold">
                استوديو صفحات السياسات والأسئلة الشائعة
              </h1>
              <p className="text-[11px] text-white/55">
                كل سياسة في صفحة منفصلة ومستقلة (__isolated_policies_v1__)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={currentRoute}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/15 px-3.5 text-xs font-bold text-cyan-200"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>معاينة الصفحة</span>
            </Link>
            <Link
              href="/schema/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs"
            >
              <Database className="h-3.5 w-3.5 text-cyan-300" />
              <span>Schema</span>
            </Link>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-black"
            >
              {savedToast ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{saving ? "جاري الحفظ..." : savedToast ? "تم الحفظ!" : "حفظ التغييرات"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        {/* Clean Page Selector */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setActiveTab(tb.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === tb.id
                  ? "bg-white text-black"
                  : "border border-white/15 bg-[#0b0815] text-white/75 hover:border-white/35"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* FAQ EDITOR */}
        {activeTab === "faq" ? (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-cyan-300" />
                <h2 className="font-serif text-lg font-semibold">إدارة الأسئلة الشائعة</h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRegistry((prev) => ({
                    ...prev,
                    faq: {
                      ...prev.faq,
                      items: [
                        ...prev.faq.items,
                        {
                          id: generateClientId("faq"),
                          category: "orders",
                          questionAr: "سؤال جديد",
                          answerAr: "الإجابة الواضحة هنا...",
                          questionEn: "",
                          answerEn: "",
                          isActive: true,
                          sortOrder: prev.faq.items.length + 1,
                        },
                      ],
                    },
                  }))
                }
                className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-bold text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إضافة سؤال</span>
              </button>
            </div>

            <div className="space-y-3">
              {registry.faq.items.map((item) => (
                <div
                  key={item.id}
                  className="space-y-3 rounded-xl border border-white/10 bg-black/45 p-4 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <select
                      value={item.category}
                      onChange={(e) =>
                        setRegistry((prev) => ({
                          ...prev,
                          faq: {
                            ...prev.faq,
                            items: prev.faq.items.map((x) =>
                              x.id === item.id
                                ? { ...x, category: e.target.value as FaqEntry["category"] }
                                : x
                            ),
                          },
                        }))
                      }
                      className="h-8 rounded-lg border border-white/15 bg-black/60 px-2.5"
                    >
                      <option value="orders">الطلبات</option>
                      <option value="shipping">الشحن</option>
                      <option value="products">المنتجات</option>
                      <option value="payments">الدفع والكوبونات</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setRegistry((prev) => ({
                            ...prev,
                            faq: {
                              ...prev.faq,
                              items: prev.faq.items.map((x) =>
                                x.id === item.id ? { ...x, isActive: !x.isActive } : x
                              ),
                            },
                          }))
                        }
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          item.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/45"
                        }`}
                      >
                        {item.isActive ? "مفعّل" : "مخفي"}
                      </button>

                      {confirmDeleteId === item.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            setRegistry((prev) => ({
                              ...prev,
                              faq: {
                                ...prev.faq,
                                items: prev.faq.items.filter((x) => x.id !== item.id),
                              },
                            }));
                            setConfirmDeleteId(null);
                          }}
                          className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white"
                        >
                          تأكيد؟
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="rounded-full border border-white/15 p-1.5 text-white/55 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    value={item.questionAr}
                    onChange={(e) =>
                      setRegistry((prev) => ({
                        ...prev,
                        faq: {
                          ...prev.faq,
                          items: prev.faq.items.map((x) =>
                            x.id === item.id ? { ...x, questionAr: e.target.value } : x
                          ),
                        },
                      }))
                    }
                    className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-semibold"
                  />
                  <textarea
                    rows={2}
                    value={item.answerAr}
                    onChange={(e) =>
                      setRegistry((prev) => ({
                        ...prev,
                        faq: {
                          ...prev.faq,
                          items: prev.faq.items.map((x) =>
                            x.id === item.id ? { ...x, answerAr: e.target.value } : x
                          ),
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-white/15 bg-black/60 p-3"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "contact" ? (
          /* CONTACT & ABOUT EDITOR */
          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-300" />
              <h2 className="font-serif text-lg font-semibold">محتوى صفحة من نحن وتواصل معنا</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-white/65">العنوان الرئيسي</span>
                <input
                  value={registry.contact.titleAr}
                  onChange={(e) =>
                    setRegistry((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, titleAr: e.target.value },
                    }))
                  }
                  className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-white/65">العنوان الفرعي</span>
                <input
                  value={registry.contact.subtitleAr}
                  onChange={(e) =>
                    setRegistry((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, subtitleAr: e.target.value },
                    }))
                  }
                  className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-white/65">ساعات العمل</span>
                <input
                  value={registry.contact.workingHoursAr}
                  onChange={(e) =>
                    setRegistry((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, workingHoursAr: e.target.value },
                    }))
                  }
                  className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-white/65">نطاق التواجد</span>
                <input
                  value={registry.contact.locationAr}
                  onChange={(e) =>
                    setRegistry((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, locationAr: e.target.value },
                    }))
                  }
                  className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-white/65">نبذة عن البراند (من نحن)</span>
              <textarea
                rows={3}
                value={registry.contact.storyAr}
                onChange={(e) =>
                  setRegistry((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, storyAr: e.target.value },
                  }))
                }
                className="w-full rounded-xl border border-white/15 bg-black/60 p-3"
              />
            </label>
            <p className="text-[11px] text-white/50">
              ملاحظة: رقم الواتساب وبريد الدعم يقرآن تلقائياً من إعدادات المتجر في /admin/.
            </p>
          </div>
        ) : (
          /* POLICY DOCUMENT EDITOR */
          (() => {
            const doc = registry.documents[activeTab];
            return (
              <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0b0815] p-6 text-xs">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-white/65">عنوان السياسة</span>
                    <input
                      value={doc.titleAr}
                      onChange={(e) =>
                        setRegistry((prev) => ({
                          ...prev,
                          documents: {
                            ...prev.documents,
                            [activeTab]: { ...doc, titleAr: e.target.value },
                          },
                        }))
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-white/65">الوصف الفرعي</span>
                    <input
                      value={doc.subtitleAr}
                      onChange={(e) =>
                        setRegistry((prev) => ({
                          ...prev,
                          documents: {
                            ...prev.documents,
                            [activeTab]: { ...doc, subtitleAr: e.target.value },
                          },
                        }))
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-white/65">تاريخ التحديث</span>
                    <input
                      dir="ltr"
                      value={doc.updatedLabel}
                      onChange={(e) =>
                        setRegistry((prev) => ({
                          ...prev,
                          documents: {
                            ...prev.documents,
                            [activeTab]: { ...doc, updatedLabel: e.target.value },
                          },
                        }))
                      }
                      className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-sm font-bold">بنود الوثيقة ({doc.sections.length})</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setRegistry((prev) => ({
                        ...prev,
                        documents: {
                          ...prev.documents,
                          [activeTab]: {
                            ...doc,
                            sections: [
                              ...doc.sections,
                              {
                                id: generateClientId("sec"),
                                titleAr: "بند جديد",
                                bodyAr: "تفاصيل البند...",
                                titleEn: "",
                                bodyEn: "",
                              },
                            ],
                          },
                        },
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-cyan-400/35 bg-cyan-500/15 px-3.5 py-1.5 font-bold text-cyan-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>إضافة بند</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {doc.sections.map((sec) => (
                    <div
                      key={sec.id}
                      className="space-y-2 rounded-xl border border-white/10 bg-black/45 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          value={sec.titleAr}
                          onChange={(e) =>
                            setRegistry((prev) => ({
                              ...prev,
                              documents: {
                                ...prev.documents,
                                [activeTab]: {
                                  ...doc,
                                  sections: doc.sections.map((s) =>
                                    s.id === sec.id ? { ...s, titleAr: e.target.value } : s
                                  ),
                                },
                              },
                            }))
                          }
                          className="h-9 flex-1 rounded-xl border border-white/15 bg-black/60 px-3 font-semibold"
                        />
                        {confirmDeleteId === sec.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              setRegistry((prev) => ({
                                ...prev,
                                documents: {
                                  ...prev.documents,
                                  [activeTab]: {
                                    ...doc,
                                    sections: doc.sections.filter((s) => s.id !== sec.id),
                                  },
                                },
                              }));
                              setConfirmDeleteId(null);
                            }}
                            className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold text-white"
                          >
                            تأكيد؟
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(sec.id)}
                            className="rounded-full border border-white/15 p-1.5 text-white/55 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={sec.bodyAr}
                        onChange={(e) =>
                          setRegistry((prev) => ({
                            ...prev,
                            documents: {
                              ...prev.documents,
                              [activeTab]: {
                                ...doc,
                                sections: doc.sections.map((s) =>
                                  s.id === sec.id ? { ...s, bodyAr: e.target.value } : s
                                ),
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-white/15 bg-black/60 p-3"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
