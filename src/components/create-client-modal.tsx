"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    agencyId: string;
    onSuccess: () => void;
}

export default function CreateClientModal({ isOpen, onClose, agencyId, onSuccess }: CreateClientModalProps) {
    const [name, setName] = useState("");
    const [brandId, setBrandId] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await addDoc(collection(db, "agencies", agencyId, "clients"), {
                agencyId,
                name: name.trim(),
                brandId: brandId.trim(),
                createdAt: serverTimestamp(),
            });
            setName("");
            setBrandId("");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error adding client:", error);
            alert("حدث خطأ أثناء إضافة العميل. يرجى المحاولة مرة أخرى.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
            <div className="bg-white w-full max-w-md border border-black p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="mb-6">
                    <h2 className="text-xl font-bold">إضافة عميل جديد</h2>
                    <p className="text-sm text-black/40">أدخل اسم العميل للبدء</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider">
                                اسم العميل
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    const newName = e.target.value;
                                    setName(newName);
                                    // Auto-generate brandId if it hasn't been manually edited
                                    // or if we want to provide a helpful default
                                    // Only auto-update if name is changing (simple behavior)
                                    const generated = newName.toLowerCase().replace(/[^a-z0-9]/g, "");
                                    setBrandId(generated);
                                }}
                                placeholder="مثال: شركة صقر"
                                className="w-full px-4 py-3 border border-black/10 focus:border-black outline-none transition-colors text-sm"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="brandId" className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                                <span>المعرف (Brand ID)</span>
                                <span className="text-[10px] text-black/40 font-normal normal-case">English, lowercase, no spaces</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="brandId"
                                    type="text"
                                    value={brandId}
                                    onChange={(e) => {
                                        // Enforce format validation on input
                                        const clean = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
                                        setBrandId(clean);
                                    }}
                                    placeholder="e.g. saqr"
                                    className="w-full px-4 py-3 border border-black/10 focus:border-black outline-none transition-colors text-sm font-mono dir-ltr text-left"
                                    required
                                    dir="ltr"
                                />
                            </div>
                            <p className="text-[10px] text-black/40">
                                يستخدم هذا المعرف لمطابقة اسم العميل مع النتائج في تحليل المنافسين. يجب أن يكون دقيقاً.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading || !name.trim() || !brandId.trim()}
                            className="flex-1 bg-black text-white text-xs font-bold py-3 hover:bg-black/90 disabled:bg-black/20 transition-all duration-300"
                        >
                            {loading ? "جاري الحفظ..." : "حفظ العميل"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 border border-black/10 text-xs font-bold hover:bg-black/5 transition-all duration-300"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
