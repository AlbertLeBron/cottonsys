export interface AlertData {
    title: 'string';
    content: 'string';
    actions?: Action[];
    options?: any;
}

export interface Action {
    text: string;
    callback: Function;
}