export interface User {
    _id:       string;
    name:      string;
    email:     string;
    role:      'Admin' | 'Cliente';
    avatar:    string | null;
    active:    boolean;
    createdAt: string;
    updatedAt: string;
}