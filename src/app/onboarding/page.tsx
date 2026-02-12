"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import Image from "next/image";
import { z } from "zod";

const onboardingSchema = z.object({
    companyName: z.string().min(3, "اسم الشركة يجب أن يكون 3 أحرف على الأقل").max(50, "اسم الشركة طويل جداً"),
    slug: z.string()
        .min(3, "المعرف يجب أن يكون 3 أحرف على الأقل")
        .regex(/^[a-z0-9]+$/, "المعرف يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام فقط")
});

export default function OnboardingPage() {
    const { user, company, loading: authLoading, refreshCompany } = useAuth();
    const [companyName, setCompanyName] = useState("");
    const [slug, setSlug] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth");
        } else if (!authLoading && company) {
            router.push(`/c/${user?.uid}`);
        }
    }, [authLoading, user, company, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || submitting) return;
        setError("");

        const validation = onboardingSchema.safeParse({ companyName, slug });
        if (!validation.success) {
            const flattened = validation.error.flatten();
            const errorMsg = flattened.fieldErrors.companyName?.[0] || flattened.fieldErrors.slug?.[0] || "حدث خطأ ما";
            setError(errorMsg);
            return;
        }

        setSubmitting(true);
        try {
            // Document ID is user.uid
            await setDoc(doc(db, "companies", user.uid), {
                name: companyName.trim(),
                slug: slug.trim(), // User defined slug
                createdAt: new Date().toISOString(),
                ownerId: user.uid,
                email: user.email
            });
            await refreshCompany();
            router.push(`/c/${user.uid}`);
        } catch (error) {
            console.error("Error creating company:", error);
            setError("حدث خطأ أثناء الإنشاء. حاول مرة أخرى.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-white p-6 selection:bg-black selection:text-white" dir="rtl">
            <div className="w-full max-w-[400px]">
                <div className="mb-12 flex justify-center">
                    <Image
                        src="/saqr-logo.svg"
                        alt="Saqr Logo"
                        width={50}
                        height={50}
                        className="w-12 h-12 object-contain"
                    />
                </div>

                <div className="space-y-2 mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">إعداد حساب الشركة</h1>
                    <p className="text-black/50 text-sm">أدخل بيانات شركتك للبدء</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="companyName" className="text-xs font-bold uppercase tracking-wider text-black/40">
                                اسم الشركة
                            </label>
                            <input
                                id="companyName"
                                type="text"
                                value={companyName}
                                onChange={(e) => {
                                    setCompanyName(e.target.value);
                                    // Auto-generate slug if not manually edited seriously
                                    if (!slug || slug === companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, slug.length)) {
                                        const generated = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
                                        setSlug(generated);
                                    }
                                    setError("");
                                }}
                                placeholder="أدخل اسم الشركة..."
                                className={`w-full px-4 py-3 border focus:border-black outline-none transition-colors text-sm ${error ? "border-red-500" : "border-black/10"}`}
                                disabled={submitting}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-black/40 flex justify-between">
                                <span>المعرف (Slug)</span>
                                <span className="text-[10px] font-normal normal-case">English, lowercase, no spaces</span>
                            </label>
                            <input
                                id="slug"
                                type="text"
                                value={slug}
                                onChange={(e) => {
                                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                                    setError("");
                                }}
                                placeholder="saqr"
                                className={`w-full px-4 py-3 border focus:border-black outline-none transition-colors text-sm font-mono dir-ltr text-left ${error ? "border-red-500" : "border-black/10"}`}
                                disabled={submitting}
                                dir="ltr"
                                required
                            />
                        </div>

                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !companyName.trim() || !slug.trim()}
                        className="w-full py-3.5 bg-black text-white font-bold hover:bg-black/90 disabled:bg-black/20 transition-all duration-300 rounded-none outline-none focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                        {submitting ? "جاري الإنشاء..." : "حفظ والمتابعة"}
                    </button>
                </form>
            </div>
        </main>
    );
}
