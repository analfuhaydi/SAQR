"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthPage() {
    const { user, company, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user) {
            if (company) {
                router.push(`/c/${user.uid}`);
            } else {
                router.push("/onboarding");
            }
        }
    }, [user, company, authLoading, router]);

    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Auth error:", error);
        }
    };

    if (authLoading || user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">جاري التحقق…</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-white p-6 selection:bg-black selection:text-white">
            <div className="w-full max-w-[400px] flex flex-col items-center">
                <div className="mb-12">
                    <Image
                        src="/saqr-logo.svg"
                        alt="Saqr Logo"
                        width={60}
                        height={60}
                        className="w-15 h-15 object-contain"
                        priority
                    />
                </div>

                <div className="w-full text-center space-y-2 mb-10">
                    <h1 className="text-2xl font-bold tracking-tight">أهلاً بك في صقر</h1>
                    <p className="text-black/50 text-sm">سجل دخولك لتبدأ تتبع بياناتك</p>
                </div>

                <button
                    onClick={handleSignIn}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-black text-white font-bold hover:bg-black/90 transition-all duration-300 rounded-none focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-2 outline-none group"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    تسجيل الدخول باستخدام Google
                </button>

                <p className="mt-8 text-[11px] text-black/30 text-center leading-relaxed">
                    باستخدامك لصقر، أنت توافق على <br />
                    <Link href="/terms" className="underline hover:text-black">شروط الخدمة</Link> و <Link href="/privacy" className="underline hover:text-black">سياسة الخصوصية</Link>
                </p>
            </div>
        </main>
    );
}
