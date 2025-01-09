import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      include: {
        answers: true,
        tags: true,
      },
    });
    return NextResponse.json(questions);
  } catch (error) {
    console.error('GET request error:', error);
    return NextResponse.json({ error: 'Error fetching questions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const question = await prisma.question.create({
      data: {
        title: data.title,
        question: data.question,
        difficulty: data.difficulty,
        markdownContent: data.markdownContent,
        type: data.type,
        answers: {
          create: data.answers.map((answer: any) => ({
            text: answer.text,
            isCorrect: answer.isCorrect,
          })),
        },
        tags: {
          connectOrCreate: data.tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: {
        answers: true,
        tags: true,
      },
    });
    return NextResponse.json(question);
  } catch (error) {
    console.error('POST request error:', error);
    return NextResponse.json({ error: 'Error creating question' }, { status: 500 });
  }
}
