import type { RisingTermRow } from "./TrendsRepo.js";

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export class TrendScoring {
    filterByTopic(rows: RisingTermRow[], topic: string): RisingTermRow[] {
        const t = normalize(topic);
        if (!t) return rows;

        // 1. Try exact match (substring) first
        // If the user typed a specific phrase like "air fryer", we prioritize that.
        const exactMatches = rows.filter(r => normalize(r.term).includes(t));
        if (exactMatches.length > 0) return exactMatches;

        // 2. If no exact matches, try keyword matching (Fallback for natural language)
        // e.g. "Find me a good pet product" -> keywords: ["pet"]
        const stopWords = [
            "find", "me", "a", "good", "best", "top", "trending", "product", "products", 
            "items", "dropshipping", "for", "in", "the", "of", "with", "looking", "search"
        ];
        
        const keywords = t.split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 2);

        if (keywords.length === 0) {
            // If the topic was just stop words (e.g. "best products"), return everything
            // rather than nothing.
            return rows; 
        }

        // Return rows that contain AT LEAST ONE of the keywords
        return rows.filter(r => {
            const term = normalize(r.term);
            return keywords.some(k => term.includes(k));
        });
    }

    isLikelyProductTerm(term: string): boolean {
        const s = normalize(term);

        // Exclude common non-product patterns
        const blocklist = [
            "vs", "score", "highlights", "results", "election",
            "weather", "map", "meaning", "lyrics", "twitter", "tiktok",
            "instagram", "youtube", "net worth", "age", "wife", "girlfriend",
            "who is", "when is", "how to"
        ];
        if (blocklist.some(b => s.includes(b))) return false;

        // Encourage commerce-y patterns
        const allowHints = [
            "buy", "price", "best", "review", "discount", "deal", "near me",
            "air fryer", "blender", "printer", "headphones", "keyboard",
            "sneakers", "perfume", "skincare", "protein", "supplement",
            "pet", "cat", "dog", "kit", "set", "gift", "sale"
        ];
        if (allowHints.some(a => s.includes(a))) return true;

        // Default to true for MVP, but mark low confidence if needed
        return true;
    }

    rankEmerging(rows: RisingTermRow[]): RisingTermRow[] {
        // Lower rank is better (1 is top). Score might exist; if so, use it.
        return [...rows].sort((a, b) => {
            const aKey = a.rank ?? 999;
            const bKey = b.rank ?? 999;
            return aKey - bKey;
        });
    }
}
