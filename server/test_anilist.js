import fetch from 'node-fetch';
import fs from 'fs';

async function test() {
    try {
        const importedData = JSON.parse(fs.readFileSync('../anilist-returned.json', 'utf8'));
        const res = await fetch('http://localhost:3000/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                importedData,
                excludeWatched: true
            })
        });
        
        if (!res.ok) {
            console.error("HTTP Error:", res.status, await res.text());
            return;
        }

        const data = await res.json();
        console.log("Response length:", data.length);
        if (data.length > 0) {
            console.log("First item:", data[0].title);
        } else {
            console.log("Empty array");
        }
    } catch (e) {
        console.error(e);
    }
}
test();
