"use client";

import { X } from "lucide-react";

interface RawAnswerModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string | undefined;
}

export default function RawAnswerModal({ isOpen, onClose, content }: RawAnswerModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm h-[100dvh] w-screen" dir="rtl">
            <div className="bg-white w-full h-full md:h-[90vh] md:w-[90vw] md:max-w-4xl md:rounded-lg border border-black p-0 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col relative">

                {/* Close Button - Desktop: Top Right (Visual), Mobile: Top Right */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <div className="p-6 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
                    <div>
                        <h2 className="text-xl font-bold">الإجابة الخام</h2>
                        <p className="text-sm text-black/40 mt-1">النص الكامل للإجابة كما ورد من المصدر</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="prose prose-lg max-w-none dir-rtl text-right whitespace-pre-wrap font-mono text-sm leading-loose bg-black/[0.02] p-6 rounded-md border border-black/5">
                        {content || "لا يوجد محتوى للعرض."}
                    </div>
                </div>
            </div>
        </div>
    );
}
