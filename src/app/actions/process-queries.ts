"use server";

import { fetchAndRunQueries } from "./run-queries";
import { analyzeAnswer } from "./analyze-answers";
import { db } from "@/lib/firebase";
import { runTransaction, doc, collection, getDoc } from "firebase/firestore";

export async function processQueries(options?: { queryConfigs?: { id: string; times: number }[], companyUid?: string }) {
    try {
        console.log("Starting query processing pipeline...", options);

        // 1. Fetch & Run Queries
        const results = await fetchAndRunQueries(options?.queryConfigs, options?.companyUid);
        console.log(`Fetched and ran ${results.length} queries.`);

        // 2. Analyze & Save Results
        const processingPromises = results.map(async (result) => {
            const { queryId, queryText, queryDocPath, runs } = result;

            // Reconstruct the reference path for saving answers
            // New path: "companies/{companyUid}/queries/{queryId}"
            const pathSegments = queryDocPath.split("/");

            // Validate path structure (companies/uid/queries/queryId)
            if (pathSegments.length < 4 || pathSegments[0] !== "companies") {
                console.error(`Invalid or legacy query path ignored: ${queryDocPath}`);
                return;
            }

            // Reconstruct company path: companies/{companyUid}
            const companyPath = pathSegments.slice(0, 2).join("/"); // "companies/uid"
            const companyRef = doc(db, companyPath);
            const answersCollectionRef = collection(companyRef, "answers");

            for (const run of runs) {
                try {
                    // Fetch Company Name
                    const companySnap = await getDoc(companyRef);
                    const companyData = companySnap.data();
                    const companyName = companyData?.name || "Unknown Company";

                    // Analyze
                    // Note: analyzeAnswer mostly uses name for "My Company" detection if implied, 
                    // but we will rely more on strict ID matching in the frontend/logic. 
                    // However, defining "my company" in prompt still helps.
                    const analysis = await analyzeAnswer(run.rawAnswer, queryText, companyName);

                    await runTransaction(db, async (transaction) => {
                        const newAnswerRef = doc(answersCollectionRef);

                        transaction.set(newAnswerRef, {
                            queryId,
                            queryText,
                            rawAnswer: run.rawAnswer,
                            citations: run.citations,

                            competitors: analysis.competitors,
                            createdAt: new Date(),
                            aiProvider: {
                                id: "gemini",
                                model: result.model
                            }
                        });
                    });

                } catch (error) {
                    console.error(`Error processing run ${run.runIndex} for query ${queryId}:`, error);
                }
            }
        });

        await Promise.all(processingPromises);

        return { success: true, processed: results.length };
    } catch (error) {
        console.error("Error processing queries:", error);
        return { success: false, error: String(error) };
    }
}

function checkMatch(id: string, name: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    return normalize(id) === normalize(name);
}
