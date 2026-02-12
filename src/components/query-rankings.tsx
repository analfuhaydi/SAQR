import { useState } from "react";
import { Trophy, Link as LinkIcon } from "lucide-react";

export interface CompetitorRank {
    name: string;
    rank: number;
    mentions: number;
    avgPosition?: string;
    isClient?: boolean;
}

// Update interface
export interface CitationRank {
    urls: string[];
    title?: string;
    count: number;
}

interface QueryRankingsProps {
    competitors: CompetitorRank[];
    citations: CitationRank[];
    onSelectCompetitor?: (name: string) => void;
    selectedCompetitor?: string;
}

export default function QueryRankings({ competitors, citations, onSelectCompetitor, selectedCompetitor }: QueryRankingsProps) {
    const [view, setView] = useState<"competitors" | "citations">("competitors");

    // State to track which citation is expanded
    const [expandedCitation, setExpandedCitation] = useState<number | null>(null);

    const toggleCitation = (index: number) => {
        if (expandedCitation === index) {
            setExpandedCitation(null);
        } else {
            setExpandedCitation(index);
        }
    };

    return (
        <div className="bg-white border border-black/5 rounded-lg overflow-hidden">
            <div className="flex border-b border-black/5">
                <button
                    onClick={() => setView("competitors")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${view === "competitors"
                        ? "bg-black/[0.02] text-black border-b-2 border-black"
                        : "text-black/40 hover:text-black/60 hover:bg-black/[0.01]"
                        }`}
                >
                    <Trophy className="w-4 h-4" />
                    المنافسين
                </button>
                <button
                    onClick={() => setView("citations")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${view === "citations"
                        ? "bg-black/[0.02] text-black border-b-2 border-black"
                        : "text-black/40 hover:text-black/60 hover:bg-black/[0.01]"
                        }`}
                >
                    <LinkIcon className="w-4 h-4" />
                    الاستشهادات
                </button>
            </div>

            <div className="p-4">
                {view === "competitors" ? (
                    <div className="space-y-2">
                        {competitors.length === 0 ? (
                            <div className="text-center py-8 text-black/40 text-sm">
                                لايوجد بيانات منافسين
                            </div>
                        ) : (
                            competitors.sort((a, b) => a.rank - b.rank).map((comp) => {
                                const isSelected = selectedCompetitor === comp.name;
                                return (
                                    <div
                                        key={comp.name}
                                        onClick={() => onSelectCompetitor?.(comp.name)}
                                        className={`flex flex-col p-3 rounded border transition-colors cursor-pointer ${isSelected
                                            ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                                            : comp.isClient
                                                ? "bg-green-50 border-green-200"
                                                : "bg-white border-black/5 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${comp.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                                                    comp.rank === 2 ? "bg-gray-100 text-gray-700" :
                                                        comp.rank === 3 ? "bg-orange-100 text-orange-700" :
                                                            "bg-black/5 text-black/40"
                                                    }`}>
                                                    {comp.rank}
                                                </div>
                                                <span className={`font-medium ${comp.isClient ? "text-green-900" : "text-black"}`}>
                                                    {comp.name}
                                                    {comp.isClient && <span className="mr-2 text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full">أنت</span>}
                                                </span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-bold">{comp.mentions}</span>
                                                <span className="text-black/40 mr-1">ظهور</span>
                                            </div>
                                        </div>

                                        {/* Additional Metrics */}
                                        <div className="flex items-center gap-4 text-xs text-black/60 pr-9">
                                            {comp.avgPosition && (
                                                <div className="flex items-center gap-1">
                                                    <span>متوسط المركز:</span>
                                                    <span className="font-semibold text-black">#{comp.avgPosition}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {citations.length === 0 ? (
                            <div className="text-center py-8 text-black/40 text-sm">
                                لايوجد بيانات مصادر
                            </div>
                        ) : (
                            citations.sort((a, b) => b.count - a.count).map((citation, i) => (
                                <div key={i} className="border border-black/5 rounded bg-white overflow-hidden transition-all">
                                    <div
                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/[0.01]"
                                        onClick={() => toggleCitation(i)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold text-black/40 flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <span
                                                className="text-sm text-black truncate dir-ltr text-left font-medium"
                                                title={citation.title}
                                            >
                                                {citation.title || "Unknown Source"}
                                            </span>
                                        </div>
                                        <div className="text-sm flex-shrink-0 flex items-center gap-2">
                                            <span className="font-bold">{citation.count}</span>
                                            <span className="text-black/40">مرة</span>
                                        </div>
                                    </div>

                                    {/* Dropdown for URLs */}
                                    {expandedCitation === i && (
                                        <div className="bg-gray-50 p-3 border-t border-black/5 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                            {citation.urls.map((url, urlIndex) => (
                                                <a
                                                    key={urlIndex}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 text-sm p-2 rounded hover:bg-black/5 transition-colors group"
                                                >
                                                    <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-xs font-medium text-black/60 group-hover:bg-black/20 group-hover:text-black">
                                                        {urlIndex + 1}
                                                    </span>
                                                    <span className="text-blue-600 hover:underline truncate dir-ltr">
                                                        رابط المصدر {urlIndex + 1}
                                                    </span>
                                                    <LinkIcon className="w-3 h-3 text-black/20 ml-auto" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

