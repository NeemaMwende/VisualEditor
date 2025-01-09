// app/api/questions/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const question = await prisma.question.findUnique({
      where: {
        id: params.id
      },
      include: {
        answers: true,
        tags: true
      }
    });

    if (!question) {
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { message: 'Failed to fetch question', error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Delete existing answers and tags
    await prisma.answer.deleteMany({
      where: {
        questionId: params.id
      }
    });

    // Update question with new data
    const updatedQuestion = await prisma.question.update({
      where: {
        id: params.id
      },
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
          set: [], // Remove existing tags
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

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { message: 'Failed to update question', error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Delete the question (cascade delete will handle related records)
    await prisma.question.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { message: 'Failed to delete question', error: String(error) },
      { status: 500 }
    );
  }
}