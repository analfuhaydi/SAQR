import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, Info, Search, BarChart2, MessageSquare, Link as LinkIcon } from "lucide-react";
import RawAnswerModal from "./raw-answer-modal";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";

export interface QueryRun {
    id: string;
    createdAt: Date | string;
    rawAnswer?: string;
    isMentioned: boolean;
    competitors?: any[];
    citations: { uri: string; title: string }[];
    // New metrics
    visibility: number;
    averagePosition: number;
    sentiment: number;  // 0-100
    reasoning: string;  // Arabic text
}

interface QueryRunsTableProps {
    runs: QueryRun[];
}

export default function QueryRunsTable({ runs }: QueryRunsTableProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    const getSentimentColor = (score: number) => {
        if (score >= 85) return "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (score >= 65) return "bg-blue-100 text-blue-800 border-blue-200";
        if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200";
        return "bg-red-100 text-red-800 border-red-200";
    };

    const getSentimentLabel = (score: number) => {
        if (score >= 85) return "إيجابي جداً";
        if (score >= 65) return "إيجابي";
        if (score >= 40) return "محايد";
        return "سلبي";
    };

    return (
        <TooltipProvider>
            <div className="w-full space-y-4">

                <div className="w-full overflow-x-auto border border-black/5 rounded-xl bg-white shadow-sm">
                    <table className="w-full text-sm text-right min-w-[800px]">
                        <thead className="bg-black/[0.02] text-black/60 font-medium whitespace-nowrap border-b border-black/5">
                            <tr>
                                <th className="px-6 py-4 w-[120px]">
                                    <div className="flex items-center gap-2">
                                        <Search className="w-4 h-4" />
                                        الظهور
                                    </div>
                                </th>
                                <th className="px-6 py-4 w-[120px] text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <BarChart2 className="w-4 h-4" />
                                        المركز
                                    </div>
                                </th>
                                <th className="px-6 py-4 w-[150px] text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        المشاعر
                                    </div>
                                </th>
                                <th className="px-6 py-4 min-w-[300px]">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        التعليل
                                    </div>
                                </th>
                                <th className="px-6 py-4 w-[250px]">
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="w-4 h-4" />
                                        المصادر
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {runs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-black/40 bg-black/[0.01]">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <p>لا توجد سجلات بحث حتى الآن</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                runs.map((run) => {
                                    return (
                                        <tr
                                            key={run.id}
                                            className="hover:bg-black/[0.02] transition-colors cursor-pointer group"
                                            onClick={() => setSelectedAnswer(run.rawAnswer || null)}
                                        >
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all ${run.isMentioned
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-100"
                                                        : "bg-red-50 text-red-700 border border-red-100"
                                                        }`}
                                                >
                                                    {run.isMentioned ? "تم ذكره" : "لم يذكر"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-lg">
                                                {run.averagePosition > 0 ? (
                                                    <span className="text-black">#{run.averagePosition}</span>
                                                ) : (
                                                    <span className="text-black/20">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {run.isMentioned ? (
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${getSentimentColor(run.sentiment)}`}>
                                                            {run.sentiment}%
                                                        </span>
                                                        <span className="text-[10px] text-black/40 font-medium">{getSentimentLabel(run.sentiment)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-black/20">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {run.reasoning ? (
                                                    <p className="text-sm text-black/70 leading-relaxed min-w-[300px]">
                                                        {run.reasoning}
                                                    </p>
                                                ) : (
                                                    <span className="text-black/20 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                <CitationsList citations={run.citations} />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <RawAnswerModal
                    isOpen={!!selectedAnswer}
                    onClose={() => setSelectedAnswer(null)}
                    content={selectedAnswer || ""}
                />
            </div>
        </TooltipProvider>
    );
}

function CitationsList({ citations }: { citations: { uri: string; title: string }[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const visibleCitations = isExpanded ? citations : citations.slice(0, 2);
    const hasMore = citations.length > 2;

    if (citations.length === 0) {
        return <span className="text-black/20">-</span>;
    }

    return (
        <div className="flex flex-col gap-2">
            {visibleCitations.map((citation, i) => (
                <a
                    key={i}
                    href={citation.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 group/link max-w-[200px]"
                    title={citation.title || citation.uri}
                >
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover/link:bg-blue-100 transition-colors">
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="truncate text-black/60 group-hover/link:text-blue-600 transition-colors underline-offset-4 group-hover/link:underline">
                        {citation.title || new URL(citation.uri).hostname}
                    </span>
                </a>
            ))}

            {hasMore && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-black/40 hover:text-black mt-1 transition-colors w-fit px-2 py-1 rounded-md hover:bg-black/5"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-3 h-3" />
                            عرض أقل
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-3 h-3" />
                            +{citations.length - 2} مصادر إضافية
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
