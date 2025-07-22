import { parseStringPromise } from 'xml2js';

export async function parseTCX(xml: string) {
    const data = await parseStringPromise(xml);
    // Placeholder for actual TCX parsing logic
    return {
        message: 'TCX parsed successfully',
        zones: [],
        sprints: [],
        hsr: []
    };
}