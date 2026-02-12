"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Company } from "@/types/company";

interface AuthContextType {
    user: User | null;
    company: Company | null;
    loading: boolean;
    refreshCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, company: null, loading: true, refreshCompany: async () => { } });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCompany = async (uid: string) => {
        try {
            const companyDoc = await getDoc(doc(db, "companies", uid));
            if (companyDoc.exists()) {
                setCompany(companyDoc.data() as Company);
            } else {
                setCompany(null);
            }
        } catch (error) {
            console.error("Error fetching company:", error);
            setCompany(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                await fetchCompany(user.uid);
            } else {
                setCompany(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const refreshCompany = async () => {
        if (user) {
            await fetchCompany(user.uid);
        }
    };

    return (
        <AuthContext.Provider value={{ user, company, loading, refreshCompany }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
