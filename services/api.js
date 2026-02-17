// Basic API Service Layer
export const api = {
    get: async (url) => {
        const res = await fetch(url);
        return res.json();
    },
    post: async (url, data) => {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
        return res.json();
    }
};
