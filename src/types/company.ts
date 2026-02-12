export interface Company {
    // Document ID is the auth.uid (ownerId)
    name: string;
    slug: string; // User-defined slug (formerly companyId/brandId)
    ownerId: string; // matches auth.uid
    email: string | null;
    createdAt: string;
}
