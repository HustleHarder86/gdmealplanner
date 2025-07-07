import { NextResponse } from 'next/server';

// Simple flag to pause imports - in production you'd use a database
let IMPORT_PAUSED = false;

export async function POST() {
  IMPORT_PAUSED = true;
  return NextResponse.json({
    success: true,
    message: 'Recipe imports have been paused',
    paused: true
  });
}

export async function GET() {
  return NextResponse.json({
    paused: IMPORT_PAUSED,
    message: IMPORT_PAUSED ? 'Imports are currently paused' : 'Imports are active'
  });
}

export async function DELETE() {
  IMPORT_PAUSED = false;
  return NextResponse.json({
    success: true,
    message: 'Recipe imports have been resumed',
    paused: false
  });
}