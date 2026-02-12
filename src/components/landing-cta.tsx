"use client";

import { useAuth } from "@/components/auth-context";
import Link from "next/link";

export function LandingCTA() {
    const { user, company, loading } = useAuth();

    let href = "/auth";

    if (!loading) {
        if (user && company) {
            href = `/c/${company.slug}`;
        } else if (user && !company) {
            href = "/onboarding";
        }
    }

    return (
        <Link
            href={href}
            className="px-6 py-2.5 bg-black text-white text-sm font-bold hover:opacity-90 transition-opacity duration-300 text-center focus-visible:ring-1 focus-visible:ring-black outline-none"
        >
            ابدأ التتبع الآن
        </Link>
    );
}
