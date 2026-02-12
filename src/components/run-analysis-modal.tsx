"use client";

import { useState, useEffect } from "react";
import { Query } from "./queries-table";
import { X, Play, Loader2, Plus, Minus } from "lucide-react";

interface RunAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRun: (configs: { id: string; times: number }[]) => Promise<void>;
    queries: Query[];
}

export default function RunAnalysisModal({ isOpen, onClose, onRun, queries }: RunAnalysisModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [runCounts, setRunCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    // Initialize selection and counts
    useEffect(() => {
        if (isOpen && queries.length > 0) {
            // Default: Select all
            setSelectedIds(new Set(queries.map(q => q.id)));
            // Default count: 1 for everyone (as per user request "Least will be 1")
            const initialCounts: Record<string, number> = {};
            queries.forEach(q => {
                initialCounts[q.id] = 1;
            });
            setRunCounts(initialCounts);
        }
    }, [isOpen, queries]);

    const handleToggleAll = () => {
        if (selectedIds.size === queries.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(queries.map(q => q.id)));
        }
    };

    const handleToggleOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleCountChange = (id: string, delta: number) => {
        setRunCounts(prev => {
            const current = prev[id] || 1;
            const next = Math.min(6, Math.max(1, current + delta));
            return { ...prev, [id]: next };
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const configs = Array.from(selectedIds).map(id => ({
                id,
                times: runCounts[id] || 1
            }));
            await onRun(configs);
            onClose();
        } catch (error) {
            console.error("Error in modal run:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm h-[100dvh] w-screen" dir="rtl">
            <div className="bg-white w-full max-w-2xl border border-black p-0 shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-6 border-b border-black/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">تشغيل التحليل</h2>
                        <p className="text-sm text-black/40 mt-1">حدد الاستعلامات وعدد مرات التشغيل لكل منها</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold uppercase tracking-wider block">
                            الاستعلامات ({selectedIds.size})
                        </label>
                        <button
                            onClick={handleToggleAll}
                            className="text-xs font-medium text-black/60 hover:text-black hover:underline"
                        >
                            {selectedIds.size === queries.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
                        </button>
                    </div>

                    <div className="border border-black/10 rounded-sm divide-y divide-black/5 bg-black/[0.02]">
                        {queries.length === 0 ? (
                            <div className="p-8 text-center text-sm text-black/40">
                                لا توجد استعلامات متاحة.
                            </div>
                        ) : (
                            queries.map((query) => {
                                const isSelected = selectedIds.has(query.id);
                                const count = runCounts[query.id] || 1;

                                return (
                                    <div
                                        key={query.id}
                                        className={`flex items-center gap-4 p-4 hover:bg-black/5 transition-colors ${isSelected ? 'bg-white' : ''}`}
                                    >
                                        {/* Checkbox */}
                                        <div
                                            className="cursor-pointer pt-1"
                                            onClick={() => handleToggleOne(query.id)}
                                        >
                                            <div className={`w-5 h-5 border transition-colors flex items-center justify-center ${isSelected ? 'bg-black border-black text-white' : 'border-black/20 bg-white'}`}>
                                                {isSelected && <span className="text-xs">✓</span>}
                                            </div>
                                        </div>

                                        {/* Query Text */}
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => handleToggleOne(query.id)}
                                        >
                                            <p className={`text-sm leading-relaxed ${isSelected ? 'text-black font-medium' : 'text-black/60'}`}>
                                                {query.query}
                                            </p>
                                        </div>

                                        {/* Counter */}
                                        <div className={`flex items-center gap-3 bg-black/[0.03] rounded-md p-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCountChange(query.id, 1); }}
                                                disabled={count >= 6}
                                                className="w-7 h-7 flex items-center justify-center bg-white border border-black/10 rounded-sm hover:border-black/30 hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black disabled:hover:border-black/10"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>

                                            <span className="w-4 text-center text-sm font-bold tabular-nums">
                                                {count}
                                            </span>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCountChange(query.id, -1); }}
                                                disabled={count <= 1}
                                                className="w-7 h-7 flex items-center justify-center bg-white border border-black/10 rounded-sm hover:border-black/30 hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black disabled:hover:border-black/10"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-black/5 bg-black/[0.02] flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || selectedIds.size === 0}
                        className="flex-1 bg-black text-white text-xs font-bold py-3 hover:bg-black/90 disabled:bg-black/20 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                جاري المعالجة...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                بدء التحليل ({selectedIds.size} استعلام)
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 border border-black/10 text-xs font-bold hover:bg-black/5 transition-all duration-300 disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
}
