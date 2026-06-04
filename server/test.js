import fetch from 'node-fetch';

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                importedData: { completed: [{id: 1, score: 10}], current: [], planning: [] },
                excludeWatched: true
            })
        });
        const data = await res.json();
        console.log("Response length:", data.length);
        if (data.length > 0) {
            console.log("First item:", data[0]);
        }
    } catch (e) {
        console.error(e);
    }
}
test();
