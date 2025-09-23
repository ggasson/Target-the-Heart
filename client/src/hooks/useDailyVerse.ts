import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface BibleVerse {
  reference: string;
  text: string;
  translation_id: string;
  translation_name: string;
}

// Predefined Bible verses for consistent daily rotation
const DAILY_VERSES = [
  "john 3:16",
  "romans 8:28", 
  "philippians 4:13",
  "jeremiah 29:11",
  "psalm 23:1",
  "matthew 6:26",
  "isaiah 41:10",
  "1 corinthians 13:4-5",
  "proverbs 3:5-6",
  "romans 5:8",
  "2 corinthians 12:9",
  "psalm 46:10",
  "matthew 11:28",
  "joshua 1:9",
  "romans 15:13",
  "psalm 121:1-2",
  "1 peter 5:7",
  "galatians 2:20",
  "ephesians 2:8-9",
  "psalm 37:4",
  "matthew 5:14",
  "colossians 3:23",
  "1 john 4:19",
  "romans 12:2",
  "psalm 139:14",
  "matthew 6:33",
  "2 timothy 1:7",
  "hebrews 11:1",
  "psalm 27:1",
  "john 14:6",
  "romans 6:23"
];

function getDailyVerseIndex(): number {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return dayOfYear % DAILY_VERSES.length;
}

export function useDailyVerse() {
  const [todaysVerseRef] = useState(() => {
    const index = getDailyVerseIndex();
    return DAILY_VERSES[index];
  });

  const { data, isLoading, error } = useQuery<BibleVerse>({
    queryKey: ["daily-bible-verse", todaysVerseRef, "niv-2024"], // Added cache buster for NIV update
    queryFn: async () => {
      const response = await fetch(`/api/daily-verse?q=${encodeURIComponent(todaysVerseRef)}&v=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch verse');
      }
      return response.json();
    },
    staleTime: 0, // Force fresh fetch for now
    gcTime: 1000 * 60 * 5, // 5 minutes cache for testing
    retry: 1, // Only retry once on failure
  });

  return {
    verse: data,
    isLoading,
    error
  };
}