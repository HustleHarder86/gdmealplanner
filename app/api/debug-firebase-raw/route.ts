import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.FIREBASE_ADMIN_KEY;
  
  if (!key) {
    return NextResponse.json({ error: 'No key found' });
  }
  
  // Get raw character codes around position 175
  const chars = [];
  for (let i = 170; i < 180 && i < key.length; i++) {
    chars.push({
      position: i,
      char: key[i],
      charCode: key.charCodeAt(i),
      escaped: JSON.stringify(key[i])
    });
  }
  
  // Check what's at the specific positions
  const position175 = {
    char: key[175],
    charCode: key.charCodeAt(175),
    isNewline: key.charCodeAt(175) === 10,
    isCarriageReturn: key.charCodeAt(175) === 13,
    isBackslash: key[175] === '\\',
    next: key[176],
    nextCharCode: key.charCodeAt(176)
  };
  
  // Try different cleaning approaches
  const cleaningTests = {
    hasLiteralBackslashN: key.includes('\\n'),
    hasRealNewline: key.includes('\n'),
    hasCarriageReturn: key.includes('\r'),
    startsWithBrace: key[0] === '{',
    endsWithBrace: key[key.length - 1] === '}',
    length: key.length
  };
  
  // Check if it's double-escaped
  const doubleEscapeTest = {
    hasDoubleBackslash: key.includes('\\\\'),
    hasBackslashQuote: key.includes('\\"'),
    sample: key.substring(0, 200).replace(/\n/g, '[NEWLINE]').replace(/\r/g, '[CR]')
  };
  
  return NextResponse.json({
    position175,
    charsAround175: chars,
    cleaningTests,
    doubleEscapeTest,
    firstPrivateKeyPart: key.substring(key.indexOf('private_key'), key.indexOf('private_key') + 100)
  });
}