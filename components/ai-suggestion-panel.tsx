import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type AiSuggestion } from '@/lib/ai/schema';
import { Sparkles } from 'lucide-react';

interface AiSuggestionPanelProps {
  suggestions: AiSuggestion[];
}

export function AiSuggestionPanel({ suggestions }: AiSuggestionPanelProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI 추천
        </CardTitle>
        <CardDescription>할일 관리에 도움이 되는 추천입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="border rounded-lg p-3">
              <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
              <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
