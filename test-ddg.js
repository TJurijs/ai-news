const { image_search } = require('duckduckgo-images-api');

async function test() {
    try {
        console.log("Searching for 'AI Technology'...");
        const results = await image_search({ query: "AI Technology", moderate: true });
        console.log("Results found:", results.length);
        if (results.length > 0) {
            console.log("First result:", results[0]);
        }
    } catch (error) {
        console.error("Search failed:", error);
    }
}

test();
