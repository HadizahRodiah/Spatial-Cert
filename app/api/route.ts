import { NextResponse } from 'next/server';
import { prisma } from '@app/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const requiredFields = [
      'id',
      'fullName',
      'email',
      'course',
      'level',
      'signature',
      'registrationNumber',
      'date',
      'qrCode',
      'expiryDate',
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check for existing record
    const existing = await prisma.user.findUnique({
      where: { id: data.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User with this ID already exists' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        course: data.course,
        level: data.level,
        signature: data.signature,
        registrationNumber: data.registrationNumber,
        date: data.date,
        qrCode: data.qrCode,
        expiryDate: data.expiryDate,
      },
    });

    return NextResponse.json({ id: user.id }, { status: 201 });

  } catch (error: unknown) {
    // Narrow the error type safely
    let message = 'Failed to save user';
    if (error instanceof Error) {
      message = error.message;
      console.error('Error saving user:', error);
    } else {
      console.error('Unexpected error:', error);
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
