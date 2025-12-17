import type { RisingTermRow } from "./TrendsRepo.js";

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export class TrendScoring {
    filterByTopic(rows: RisingTermRow[], topic: string): RisingTermRow[] {
        const t = normalize(topic);
        if (!t) return rows;
        return rows.filter(r => normalize(r.term).includes(t));
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
