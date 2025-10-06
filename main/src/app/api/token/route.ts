/**
 * LiveKit Token Generator API Route
 * Generates secure tokens for clients to join LiveKit rooms
 */

import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const roomName = request.nextUrl.searchParams.get('roomName');
    const participantName = request.nextUrl.searchParams.get('participantName');

    if (!roomName) {
      return NextResponse.json(
        { error: 'Missing roomName parameter' },
        { status: 400 }
      );
    }

    if (!participantName) {
      return NextResponse.json(
        { error: 'Missing participantName parameter' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing LiveKit credentials' },
        { status: 500 }
      );
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName,
    });

    // Grant permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}