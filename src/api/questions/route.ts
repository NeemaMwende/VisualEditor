// app/api/questions/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const question = await prisma.question.create({
      data: {
        title: data.title,
        question: data.question,
        difficulty: data.difficulty,
        type: data.type,
        markdownContent: data.markdownContent,
        answers: {
          create: data.answers.map((answer: any) => ({
            text: answer.text,
            isCorrect: answer.isCorrect
          }))
        },
        tags: {
          connectOrCreate: data.tags.map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        }
      },
      include: {
        answers: true,
        tags: true
      }
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { message: 'Failed to create question', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      include: {
        answers: true,
        tags: true
      }
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch questions', error: String(error) },
      { status: 500 }
    );
  }
}