"use client";

import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Image from "next/image";
import { useAuth } from "@/components/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import QueryRankings from "@/components/query-rankings";
import QueryRunsTable, { QueryRun } from "@/components/query-runs-table";

interface QueryData {
    id: string;
    query: string;
    createdAt: string;
}

interface AnswerData {
    id: string;
    mentioned: boolean;
    competitors?: string[];
    citations?: { uri: string; title: string }[] | string[];
    rawAnswer?: string;
    createdAt?: any;
    [key: string]: any;
}

export default function QueryDetailPage() {
    const { user, company, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const companyUid = params.companyUid as string;
    const queryId = params.queryId as string;

    const [queryData, setQueryData] = useState<QueryData | null>(null);
    const [fetching, setFetching] = useState(true);

    // Raw Data
    const [answers, setAnswers] = useState<AnswerData[]>([]);

    // Processed Data
    const [runs, setRuns] = useState<QueryRun[]>([]);
    const [selectedCompetitor, setSelectedCompetitor] = useState<string>("");

    // Rankings Data
    const [rankings, setRankings] = useState<{
        competitors: { name: string; rank: number; mentions: number; isClient?: boolean; avgPosition?: string }[]; // Added avgPosition
        citations: { urls: string[]; title?: string; count: number }[];
    }>({ competitors: [], citations: [] });


    // Utility function to normalize strings for comparison
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    const fetchData = useCallback(async () => {
        if (!companyUid || !queryId || !user?.uid) return;
        setFetching(true);
        try {
            // Fetch Query Info
            const queryDocRef = await getDoc(doc(db, "companies", companyUid, "queries", queryId));
            if (queryDocRef.exists()) {
                setQueryData({ id: queryDocRef.id, ...queryDocRef.data() } as QueryData);
            }

            // Fetch Answers
            const answersQuery = query(
                collection(db, "companies", companyUid, "answers"),
                where("queryId", "==", queryId),
                orderBy("createdAt", "desc")
            );
            const answersSnapshot = await getDocs(answersQuery);
            const fetchedAnswers = answersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AnswerData[];
            setAnswers(fetchedAnswers);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setFetching(false);
        }
    }, [companyUid, queryId, user?.uid]);

    // Set default selected competitor when company loads
    useEffect(() => {
        if (company?.slug && !selectedCompetitor) {
            setSelectedCompetitor(company.slug);
        }
    }, [company, selectedCompetitor]);


    // Process Data whenever answers or selectedCompetitor changes
    useEffect(() => {
        if (!answers.length || !selectedCompetitor) {
            if (answers.length === 0) {
                setRuns([]); // Clear runs if no answers
                // No need to clear rankings effectively, they might still be relevant if just no answers for this query?
                // But actually if no answers, rankings should be empty too.
                setRankings({ competitors: [], citations: [] });
            }
            return;
        }

        const targetCompanyId = normalize(selectedCompetitor);
        const clientSlug = company ? normalize(company.slug) : "";

        // Map Answers to QueryRuns
        let queryRuns: QueryRun[] = answers.map(answer => {
            // Parse competitors
            let parsedCompetitors: any[] = [];
            if (typeof answer.competitors === 'string') {
                try {
                    parsedCompetitors = JSON.parse(answer.competitors);
                } catch (e) {
                    parsedCompetitors = [];
                }
            } else if (Array.isArray(answer.competitors)) {
                parsedCompetitors = answer.competitors;
            }

            // Parse citations
            let normalizedCitations: { uri: string; title: string }[] = [];
            if (Array.isArray(answer.citations)) {
                normalizedCitations = answer.citations.map((c: any) => {
                    if (typeof c === 'string') return { uri: c, title: '' };
                    return c;
                });
            }


            // Find client metrics using targetCompanyId
            const companyComp = parsedCompetitors.find((c: any) => {
                const compId = typeof c === 'string' ? c : (c.id || "");
                return normalize(compId) === targetCompanyId;
            });

            const isMentioned = !!companyComp;

            // Extract metrics
            const sentiment = companyComp?.sentiment || 0;
            const reasoning = companyComp?.reasoning || "";

            return {
                id: answer.id,
                createdAt: answer.createdAt?.toDate ? answer.createdAt.toDate() : new Date(),
                rawAnswer: answer.rawAnswer,
                isMentioned: isMentioned,
                competitors: parsedCompetitors,
                citations: normalizedCitations,
                visibility: isMentioned ? 100 : 0,
                averagePosition: companyComp?.position || 0,
                sentiment: sentiment,
                reasoning: reasoning
            };
        });

        setRuns(queryRuns);

        // Process Rankings (Independent of selectedCompetitor mostly, except for isClient check maybe? No, rankings are global)
        // Actually, isClient calculation in rankings should probably effectively show "You" for the logged-in user,
        // but maybe we highlight the selected one?
        // Let's keep "isClient" pointing to the actual user for clarity ("You"), but we can visualize selection in the component.

        const sourceData = queryRuns; // queryRuns has parsed competitors already.

        const competitorMap = new Map<string, { mentions: number, totalPosition: number, totalSentiment: number, count: number }>();
        const citationMap = new Map<string, { count: number, urls: string[], title?: string }>();

        sourceData.forEach((item: QueryRun) => {
            // Aggregate Competitors
            if (item.competitors) {
                item.competitors.forEach((comp: any) => {
                    let compId = "";
                    let position = 0;
                    let sentiment = 0;

                    if (typeof comp === 'string') {
                        compId = comp.toLowerCase().replace(/\s+/g, "");
                    } else {
                        compId = comp.id;
                        position = comp.position || 0;
                        sentiment = comp.sentiment || 0;
                    }

                    if (!compId) return;

                    const existing = competitorMap.get(compId);
                    if (existing) {
                        competitorMap.set(compId, {
                            mentions: existing.mentions + 1,
                            totalPosition: existing.totalPosition + position,
                            totalSentiment: existing.totalSentiment + sentiment,
                            count: existing.count + 1
                        });
                    } else {
                        competitorMap.set(compId, {
                            mentions: 1,
                            totalPosition: position,
                            totalSentiment: sentiment,
                            count: 1
                        });
                    }
                });
            }

            // Aggregate Citations
            if (item.citations) {
                item.citations.forEach((citation) => {
                    const uri = citation.uri;
                    let validTitle = citation.title;

                    if (!validTitle) {
                        try {
                            validTitle = new URL(uri).hostname;
                        } catch (e) {
                            validTitle = uri;
                        }
                    }
                    const key = validTitle;
                    const existing = citationMap.get(key);
                    if (existing) {
                        const currentUrls = existing.urls;
                        if (!currentUrls.includes(uri)) currentUrls.push(uri);
                        citationMap.set(key, { ...existing, count: existing.count + 1, urls: currentUrls });
                    } else {
                        citationMap.set(key, { count: 1, urls: [uri], title: validTitle });
                    }
                });
            }
        });

        // Format Competitors
        const competitors = Array.from(competitorMap.entries()).map(([id, data]) => ({
            name: id,
            mentions: data.mentions,
            avgPosition: data.count > 0 ? (data.totalPosition / data.count).toFixed(1) : "0",
            rank: 0,
            isClient: id === clientSlug // Still identifies the actual logged-in user
        })).sort((a, b) => b.mentions - a.mentions)
            .map((item, index) => ({ ...item, rank: index + 1 }));

        // Format Citations
        const citations = Array.from(citationMap.values()).map((data) => ({
            urls: data.urls,
            count: data.count,
            title: data.title
        })).sort((a, b) => b.count - a.count);

        setRankings({ competitors, citations });

    }, [answers, selectedCompetitor, company]);


    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/auth");
    };

    if (loading || fetching) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!user) return null;

    return (
        <main className="min-h-screen bg-white selection:bg-black selection:text-white" dir="rtl">
            {/* Header */}
            <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => router.push(`/c/${companyUid}`)}
                    >
                        <Image
                            src="/saqr-logo.svg"
                            alt="Saqr Logo"
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSignOut}
                            className="text-xs font-bold px-3 py-1.5 border border-black/10 hover:bg-black hover:text-white transition-all duration-300"
                        >
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <Breadcrumb className="mb-6">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    className="cursor-pointer"
                                    onClick={() => router.push(`/c/${companyUid}`)}
                                >
                                    {company?.name || "الشركة"}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{queryData?.query || "الاستعلام"}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="space-y-6">

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-black/5 rounded-lg p-4 flex flex-col gap-1">
                            <span className="text-sm text-black/40">نسبة الظهور ({selectedCompetitor})</span>
                            <span className="text-2xl font-bold">
                                {runs.length > 0
                                    ? Math.round((runs.filter(r => r.isMentioned).length / runs.length) * 100)
                                    : 0
                                }
                                %</span>
                        </div>
                        <div className="bg-white border border-black/5 rounded-lg p-4 flex flex-col gap-1">
                            <span className="text-sm text-black/40">متوسط المركز</span>
                            <span className="text-2xl font-bold">
                                #{runs.length > 0
                                    ? (runs.reduce((acc, r) => acc + r.averagePosition, 0) / runs.filter(r => r.averagePosition > 0).length || 0).toFixed(1)
                                    : '-'}
                            </span>
                        </div>
                        <div className="bg-white border border-black/5 rounded-lg p-4 flex flex-col gap-1">
                            <span className="text-sm text-black/40">متوسط المشاعر</span>
                            <span className="text-2xl font-bold">
                                {runs.filter(r => r.sentiment > 0).length > 0
                                    ? Math.round(runs.reduce((acc, r) => acc + r.sentiment, 0) / runs.filter(r => r.sentiment > 0).length)
                                    : '-'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2">
                            <QueryRunsTable
                                runs={runs}
                            />
                        </div>

                        <div className="lg:col-span-1">
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <QueryRankings
                                    competitors={rankings.competitors}
                                    citations={rankings.citations}
                                    onSelectCompetitor={setSelectedCompetitor}
                                    selectedCompetitor={selectedCompetitor}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

