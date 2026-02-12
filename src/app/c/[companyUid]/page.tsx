"use client";

import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Image from "next/image";
import { useAuth } from "@/components/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, collection, query, onSnapshot, addDoc, deleteDoc, orderBy } from "firebase/firestore";
import { Company } from "@/types/company"; // Updated import
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import QueriesTable, { Query } from "@/components/queries-table";
import { processQueries } from "@/app/actions/process-queries";
import RunAnalysisModal from "@/components/run-analysis-modal";

export default function CompanyDashboardPage() {
    const { user, company, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const companyUid = params.companyUid as string;

    // Queries Data
    const [rawQueries, setRawQueries] = useState<Query[]>([]);
    const [answers, setAnswers] = useState<any[]>([]);
    const [queriesLoading, setQueriesLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRunModalOpen, setIsRunModalOpen] = useState(false);

    // Helper to normalize strings
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Use companyId (slug) for matching
    const targetCompanyId = company ? company.slug : "";

    // Derived queries with stats
    const queries = rawQueries.map(q => {
        const queryAnswers = answers.filter(a => a.queryId === q.id);
        const totalSearches = queryAnswers.length;
        let totalPosition = 0;
        let positionCount = 0;
        let mentionCount = 0;
        let totalSentiment = 0;
        let sentimentCount = 0;

        queryAnswers.forEach(a => {
            let isMentioned = false;
            let pos = 0;
            let sentiment = 0;

            // Parse competitors to find position
            let parsedCompetitors: any[] = [];
            if (typeof a.competitors === 'string') {
                try {
                    parsedCompetitors = JSON.parse(a.competitors);
                } catch (e) { }
            } else if (Array.isArray(a.competitors)) {
                parsedCompetitors = a.competitors;
            }

            // Check if company is in competitors list using targetCompanyId (slug)
            const companyComp = parsedCompetitors.find((c: any) => {
                const compId = typeof c === 'string' ? c : (c.id || "");
                return normalize(compId) === targetCompanyId;
            });

            if (companyComp) {
                isMentioned = true;
                pos = typeof companyComp === 'object' ? (companyComp.position || 0) : 0;
                sentiment = typeof companyComp === 'object' ? (companyComp.sentiment || 0) : 0;
            }
            if (isMentioned) {
                mentionCount++;
                if (pos > 0) {
                    totalPosition += pos;
                    positionCount++;
                }
                if (sentiment > 0) {
                    totalSentiment += sentiment;
                    sentimentCount++;
                }
            }
        });

        const visibility = totalSearches > 0 ? Math.round((mentionCount / totalSearches) * 100) : 0;
        const averagePosition = positionCount > 0 ? (totalPosition / positionCount) : 0;
        const averageSentiment = sentimentCount > 0 ? Math.round(totalSentiment / sentimentCount) : 0;

        return {
            ...q,
            totalSearches,
            mentionCount,
            visibility,
            averagePosition,
            totalPosition,
            positionCount,
            averageSentiment
        };
    });

    const totalVisibility = queries.length > 0
        ? Math.round(queries.reduce((acc, q) => acc + q.visibility, 0) / queries.length)
        : 0;

    const totalAvgPosition = queries.filter(q => q.averagePosition > 0).length > 0
        ? (queries.reduce((acc, q) => acc + q.averagePosition, 0) / queries.filter(q => q.averagePosition > 0).length).toFixed(1)
        : '-';

    const totalAvgSentiment = queries.filter(q => q.averageSentiment > 0).length > 0
        ? Math.round(queries.reduce((acc, q) => acc + q.averageSentiment, 0) / queries.filter(q => q.averageSentiment > 0).length)
        : '-';

    const handleRunAnalysis = async (configs: { id: string; times: number }[]) => {
        setIsProcessing(true);
        try {
            // Updated to pass companyUid
            const result = await processQueries({ queryConfigs: configs, companyUid });
            if (result.success) {
                alert(`تم بدء التحليل بنجاح! تمت معالجة ${result.processed} استعلام/استعلامات.`);
            } else {
                alert('حدث خطأ أثناء بدء التحليل.');
                console.error(result.error);
            }
        } catch (error) {
            console.error('Error running analysis:', error);
            alert('فشل الاتصال بالخادم.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Fetch queries from Firestore
    useEffect(() => {
        if (!companyUid || !user?.uid) return;

        // Ensure we are accessing the right company's data
        if (companyUid !== user.uid) {
            // In a real app we might handle permissions here, but for now assumption is owner accesses own company
            // or if we have admin.
        }

        const q = query(
            collection(db, "companies", companyUid, "queries"),
            orderBy("createdAt", "desc")
        );

        const unsubscribeQueries = onSnapshot(q, (snapshot) => {
            const queriesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Query[];
            setRawQueries(queriesData);
            setQueriesLoading(false);
        });

        const answersQuery = query(
            collection(db, "companies", companyUid, "answers")
        );

        const unsubscribeAnswers = onSnapshot(answersQuery, (snapshot) => {
            const answersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAnswers(answersData);
        });

        return () => {
            unsubscribeQueries();
            unsubscribeAnswers();
        };
    }, [companyUid, user?.uid]);

    const handleAddQuery = async (text: string) => {
        if (!companyUid || !user?.uid) return;

        try {
            await addDoc(collection(db, "companies", companyUid, "queries"), {
                query: text,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error adding query:", error);
        }
    };

    const handleRemoveQuery = async (id: string) => {
        if (!companyUid || !user?.uid) return;

        try {
            await deleteDoc(doc(db, "companies", companyUid, "queries", id));
        } catch (error) {
            console.error("Error removing query:", error);
        }
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth");
        }
    }, [user, loading, router]);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/auth");
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!user || !company) return null;

    return (
        <main className="min-h-screen bg-white selection:bg-black selection:text-white" dir="rtl">
            {/* Header */}
            <header className="border-b border-black/5 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div
                        className="flex items-center gap-2"
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
                    {/* Simplified Breadcrumb - just Company Name since we are at root of dashboard */}
                    <h1 className="text-2xl font-bold">{company.name}</h1>
                    <p className="text-black/40 text-sm">لوحة التحكم</p>
                </div>



                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold">سجل الاستعلامات</h2>
                        <button
                            onClick={() => setIsRunModalOpen(true)}
                            disabled={isProcessing}
                            className={`text-xs font-bold px-3 py-1.5 border border-black/10 hover:bg-black hover:text-white transition-all duration-300 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isProcessing ? 'جاري التحليل...' : 'تشغيل التحليل'}
                        </button>
                    </div>

                    <RunAnalysisModal
                        isOpen={isRunModalOpen}
                        onClose={() => setIsRunModalOpen(false)}
                        onRun={handleRunAnalysis}
                        queries={queries}
                    />

                    <div className="w-full">
                        {/* Queries Table Section */}
                        <div className="space-y-4">
                            <QueriesTable
                                queries={queries}
                                onRowClick={(query) => router.push(`/c/${companyUid}/${query.id}`)}
                                onAddQuery={handleAddQuery}
                                onRemoveQuery={handleRemoveQuery}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
