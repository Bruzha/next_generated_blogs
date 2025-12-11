import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/client';

export async function POST(req: NextRequest) {
  try {
    const { articleId, newDate } = await req.json();

    if (!articleId || !newDate) {
      return NextResponse.json(
        { error: 'articleId and newDate are required' },
        { status: 400 }
      );
    }

    await client
      .patch(articleId)
      .set({ date: newDate })
      .commit();

    return NextResponse.json({
      success: true,
      message: 'Date updated successfully'
    });
  } catch (error) {
    console.error('Error updating article date:', error);
    return NextResponse.json(
      { error: 'Failed to update article date' },
      { status: 500 }
    );
  }
}
