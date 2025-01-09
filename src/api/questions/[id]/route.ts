import { NextResponse } from 'next/server';
import prisma from '@/lib/db';


export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    const question = await prisma.question.update({
      where: { id: params.id },
      data: {
        title: data.title,
        question: data.question,
        difficulty: data.difficulty,
        markdownContent: data.markdownContent,
        type: data.type,
        answers: {
          deleteMany: {},
          create: data.answers.map((answer: any) => ({
            text: answer.text,
            isCorrect: answer.isCorrect,
          })),
        },
        tags: {
          set: [],
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
    console.error('PUT request error:', error);
    return NextResponse.json({ error: 'Error updating question' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.question.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('DELETE request error:', error);
    return NextResponse.json({ error: 'Error deleting question' }, { status: 500 });
  }
}