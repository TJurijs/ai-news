const { search } = require('duck-duck-scrape');

async function test() {
    try {
        console.log("Searching for 'AI Technology'...");
        const results = await search("AI Technology", {
            searchType: "images"
        });
        console.log("Results found:", results.results.length);
        if (results.results.length > 0) {
            console.log("First result:", results.results[0]);
        }
    } catch (error) {
        console.error("Search failed:", error);
    }
}

test();
