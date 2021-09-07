export interface DeleteAccountServiceInterface {
    deleteAccount: (
        token: string,
        email: string
    ) => Promise<void>;
}