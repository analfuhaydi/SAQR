import { collectionGroup, getDocs, collection, query } from "firebase/firestore"; // Added collection, query imports or check if they exist
import { db } from "@/lib/firebase";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";

export interface QueryRunResult {
    queryId: string;
    queryText: string;
    queryDocPath: string; // Needed for reconstruction of refs
    model: string;
    runs: {
        rawAnswer: string;
        citations: { uri: string; title: string }[];
        runIndex: number;
    }[];
}

export async function fetchAndRunQueries(queryConfigs?: { id: string; times: number }[], companyUid?: string): Promise<QueryRunResult[]> {
    try {
        let queriesSnapshot;

        if (companyUid) {
            // Fetch queries only for specific company
            const q = query(collection(db, "companies", companyUid, "queries"));
            queriesSnapshot = await getDocs(q);
            console.log(`Debug: Fetched ${queriesSnapshot.size} queries for company ${companyUid}`);
        } else {
            // Fallback to all queries (admin or legacy mode) or if companyUid not provided
            queriesSnapshot = await getDocs(collectionGroup(db, "queries"));
            console.log(`Debug: Query snapshot size (collectionGroup): ${queriesSnapshot.size}`);
        }

        const allUniqueQueries = new Map();
        queriesSnapshot.forEach((doc) => {
            if (!allUniqueQueries.has(doc.id)) {
                allUniqueQueries.set(doc.id, doc);
            }
        });

        // Determine which queries to run and how many times
        let queriesToRunTargets: { doc: any; times: number }[] = [];

        if (queryConfigs && queryConfigs.length > 0) {
            // Run only specified queries with their specific times
            for (const config of queryConfigs) {
                const doc = allUniqueQueries.get(config.id);
                if (doc) {
                    queriesToRunTargets.push({ doc, times: config.times });
                }
            }
        } else {
            // Default behavior if no config provided: Run ALL queries 6 times (fallback)
            // Or should we strict filter? 
            // If queryConfigs is undefined, let's assume "Run All" with default 6.
            Array.from(allUniqueQueries.values()).forEach(doc => {
                queriesToRunTargets.push({ doc, times: 6 });
            });
        }

        const results: QueryRunResult[] = [];

        console.log(`Running ${queriesToRunTargets.length} queries.`);

        for (const target of queriesToRunTargets) {
            const queryDoc = target.doc;
            const times = target.times;

            const queryData = queryDoc.data();
            const queryText = queryData.query;
            const queryId = queryDoc.id;
            const queryDocPath = queryDoc.ref.path;

            const runs = [];

            const modelName = "gemini-3-flash-preview";
            // Execute 'times' times sequentially
            for (let i = 1; i <= times; i++) {
                try {
                    const { text, providerMetadata } = await generateText({
                        model: google(modelName),
                        tools: {
                            googleSearch: google.tools.googleSearch({}),
                        },
                        prompt: queryText,
                    });

                    const googleMetadata = providerMetadata?.google as
                        | GoogleGenerativeAIProviderMetadata
                        | undefined;
                    const groundingMetadata = googleMetadata?.groundingMetadata;
                    const citations =
                        groundingMetadata?.groundingChunks
                            ?.map((chunk) => ({
                                uri: chunk.web?.uri,
                                title: chunk.web?.title,
                            }))
                            .filter((c): c is { uri: string; title: string } => !!c.uri && !!c.title) || [];

                    runs.push({
                        rawAnswer: text,
                        citations,
                        runIndex: i,
                    });
                } catch (error) {
                    console.error(`Error in run ${i} for query ${queryId}:`, error);
                }
            }
            if (runs.length > 0) {
                results.push({
                    queryId,
                    queryText,
                    queryDocPath,
                    model: modelName,
                    runs,
                });
            }
        }

        return results;
    } catch (error) {
        console.error("Error in fetchAndRunQueries:", error);
        throw error;
    }
}
