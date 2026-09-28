export type ProjectResult = {
    message: string;
    values: number[];
};

export function buildResult(label: string): ProjectResult {
    return { message: label, values: [1, 2, 3] };
}
