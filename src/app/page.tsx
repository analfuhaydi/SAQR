import Image from "next/image";

import { LandingCTA } from "@/components/landing-cta";

export default function Home() {
  return (
    <main className="min-h-screen selection:bg-black selection:text-white flex flex-col items-center justify-center bg-white">
      <section className="w-full max-w-2xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        <div className="mb-8">
          <Image
            src="/saqr-logo.svg"
            alt="Saqr Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-black/10 text-[10px] font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
          تتبع محركات البحث بالذكاء الاصطناعي
        </div>

        <h1 className="text-3xl md:text-5xl font-bold leading-[1.15] mb-6 tracking-tight">
          تتبع، افهم، <br />
          <span className="text-black/30">واستوعب بياناتك</span>
        </h1>

        <p className="text-sm md:text-base text-black/60 max-w-md mb-8 leading-relaxed">
          صقر يمنحك الرؤية الكاملة لكيفية ظهور بياناتك في محركات الإجابة (AEO). تتبع دقيق للسوق السعودي وفهم عميق للبيانات.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <LandingCTA />
        </div>

      </section>
    </main>
  );
}
