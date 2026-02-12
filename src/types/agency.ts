export interface Agency {
    id: string; // matches user.uid
    name: string;
    createdAt: string;
    ownerId: string;
    email: string | null;
}
