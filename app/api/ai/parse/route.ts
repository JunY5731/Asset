import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { ParseResponseSchema } from '@/lib/ai/schema';
import { PARSE_TASK_PROMPT } from '@/lib/ai/prompts';
import { z } from 'zod';

const RequestSchema = z.object({
  text: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = RequestSchema.parse(body);

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'), // Gemini 2.5 사용 시 모델명 변경 필요
      schema: ParseResponseSchema,
      prompt: `${PARSE_TASK_PROMPT}\n\nUser input: ${text}`,
    });

    return NextResponse.json(object);
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
