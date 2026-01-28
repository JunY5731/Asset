import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
  query: z.string().min(1),
});

// Mock search provider (replace with actual API)
async function mockSearchProvider(query: string): Promise<{
  summary: string;
  checklist: string[];
  notes: string;
}> {
  // In production, replace this with actual search API
  // e.g., Google Custom Search, Bing Search API, etc.
  return {
    summary: `Search results for "${query}": This is a mock response. Replace with actual search API integration.`,
    checklist: [
      `Review information about ${query}`,
      `Take notes on key points`,
      `Follow up if needed`,
    ],
    notes: `Mock notes for ${query}. In production, this would contain actual search results and summaries.`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = RequestSchema.parse(body);

    // Use mock provider for now
    // TODO: Replace with actual search API (SEARCH_API_KEY from env)
    const result = await mockSearchProvider(query);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { message: 'Invalid input', details: error.message } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    );
  }
}
