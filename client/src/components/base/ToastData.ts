export interface ToastData {
    id?: string;
    state: 'ok' | 'error';
    content: string;
}