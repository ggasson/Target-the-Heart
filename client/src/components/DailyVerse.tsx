import { Card, CardContent } from "@/components/ui/card";
import { useDailyVerse } from "@/hooks/useDailyVerse";
import { BookOpen, Loader2 } from "lucide-react";

export default function DailyVerse() {
  const { verse, isLoading, error } = useDailyVerse();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading today's verse...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !verse) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <blockquote className="italic text-gray-700 dark:text-gray-300 mb-2" data-testid="text-daily-verse">
                "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
              </blockquote>
              <p className="text-sm font-semibold text-primary" data-testid="text-verse-reference">
                John 3:16 (KJV)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Today's Verse
              </span>
            </div>
            <blockquote className="italic text-gray-700 dark:text-gray-300 mb-3 leading-relaxed" data-testid="text-daily-verse">
              "{verse.text}"
            </blockquote>
            <p className="text-sm font-semibold text-primary" data-testid="text-verse-reference">
              {verse.reference} ({verse.translation_id.toUpperCase()})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}