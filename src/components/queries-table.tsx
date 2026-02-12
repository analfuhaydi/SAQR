import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Trash2, Plus, Edit2, Check } from "lucide-react";
import { useState } from "react";

export interface Query {
    id: string;
    query: string;
    mentionCount: number;
    totalSearches: number;
    // New metrics
    visibility: number;
    averagePosition: number;
    averageSentiment: number;
}

interface QueriesTableProps {
    queries: Query[];
    selectedId?: string;
    onRowClick?: (query: Query) => void;
    onAddQuery?: (query: string) => void;
    onRemoveQuery?: (id: string) => void;
}

export default function QueriesTable({
    queries,
    selectedId,
    onRowClick,
    onAddQuery,
    onRemoveQuery,
}: QueriesTableProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newQuery, setNewQuery] = useState("");

    const handleAdd = () => {
        if (newQuery.trim() && onAddQuery) {
            onAddQuery(newQuery.trim());
            setNewQuery("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleAdd();
        }
    };

    const getSentimentColor = (score: number) => {
        if (score >= 85) return "bg-green-100 text-green-800 border-green-200";
        if (score >= 65) return "bg-yellow-100 text-yellow-800 border-yellow-200";
        if (score >= 40) return "bg-orange-100 text-orange-800 border-orange-200";
        return "bg-red-100 text-red-800 border-red-200";
    };

    const getSentimentLabel = (score: number) => {
        if (score >= 85) return "ممتاز";
        if (score >= 65) return "جيد";
        if (score >= 40) return "متوسط";
        return "سلبي";
    };

    return (
        <div className="w-full overflow-hidden border border-black/5 rounded-lg relative">
            <div className="absolute top-0 left-0 p-2 z-10">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isEditing
                        ? "bg-black text-white hover:bg-black/90"
                        : "bg-transparent text-black/40 hover:text-black"
                        }`}
                >
                    {isEditing ? (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            تم
                        </>
                    ) : (
                        <>
                            <Edit2 className="w-3.5 h-3.5" />
                            تعديل
                        </>
                    )}
                </button>
            </div>
            <table className="w-full text-sm text-right">
                <thead className="bg-black/5 text-black/60 font-medium">
                    <tr>
                        <th className="px-6 py-3">الاستعلام</th>
                        <th className="px-6 py-3 text-center">نسبة الظهور</th>
                        <th className="px-6 py-3 text-center">متوسط المركز</th>
                        <th className="px-6 py-3 text-center">متوسط المشاعر</th>
                        {isEditing && <th className="px-6 py-3 w-10"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                    {queries.length === 0 && !isEditing ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-black/40">
                                لا توجد استعلامات حتى الآن
                            </td>
                        </tr>
                    ) : (
                        queries.map((item) => (
                            <tr
                                key={item.id}
                                className={`transition-colors ${onRowClick && !isEditing ? "cursor-pointer" : ""} ${selectedId === item.id && !isEditing
                                    ? "bg-green-50/50 hover:bg-green-50"
                                    : "hover:bg-black/[0.02]"
                                    }`}
                                onClick={() => !isEditing && onRowClick?.(item)}
                            >
                                <td className="px-6 py-4 font-medium text-black">{item.query}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.visibility >= 70 ? 'bg-green-100 text-green-800' :
                                        item.visibility >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {item.visibility}%
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center font-medium">
                                    {item.averagePosition > 0 ? `#${item.averagePosition.toFixed(1)}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {item.averageSentiment > 0 ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSentimentColor(item.averageSentiment)}`}>
                                                {item.averageSentiment}%
                                            </span>
                                            <span className="text-[10px] text-black/40">{getSentimentLabel(item.averageSentiment)}</span>
                                        </div>
                                    ) : (
                                        <span className="text-black/40">-</span>
                                    )}
                                </td>

                                {isEditing && (
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveQuery?.(item.id);
                                            }}
                                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                    {isEditing && (
                        <tr className="bg-black/[0.02]">
                            <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newQuery}
                                        onChange={(e) => setNewQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="أضف استعلام جديد..."
                                        className="w-full bg-transparent border-b border-black/10 focus:border-black/30 outline-none py-1 placeholder:text-black/30"
                                        autoFocus
                                    />
                                </div>
                            </td>
                            <td className="px-6 py-3">
                                <button
                                    onClick={handleAdd}
                                    disabled={!newQuery.trim()}
                                    className="p-1.5 bg-black hover:bg-black/90 text-white rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
