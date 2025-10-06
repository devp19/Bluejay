'use client';

import { useEffect, useState, useRef } from 'react';
import {
  LiveKitRoom,
  useVoiceAssistant,
  RoomAudioRenderer,
  useRoomContext,
} from '@livekit/components-react';
import { RoomEvent, TranscriptionSegment } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, PhoneOff, Radio, Loader2 } from 'lucide-react';

export default function Home() {
  const [connectionDetails, setConnectionDetails] = useState<{
    url: string;
    token: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const roomName = `f1-engineer-${Math.random().toString(36).substring(7)}`;
      const participantName = `User-${Math.random().toString(36).substring(7)}`;

      const response = await fetch(
        `/api/token?roomName=${roomName}&participantName=${participantName}`
      );

      if (!response.ok) {
        throw new Error('Failed to get token');
      }

      const data = await response.json();
      const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;

      if (!url) {
        throw new Error('LiveKit URL not configured');
      }

      setConnectionDetails({ url, token: data.token });
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect. Check console for details.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConnectionDetails(null);
  };

  return (
    <main className="h-screen bg-black">
      {!connectionDetails ? (
        <WelcomeScreen onConnect={handleConnect} isConnecting={isConnecting} />
      ) : (
        <LiveKitRoom
          serverUrl={connectionDetails.url}
          token={connectionDetails.token}
          onDisconnected={handleDisconnect}
          className="h-full"
        >
          <ChatInterface onDisconnect={handleDisconnect} />
        </LiveKitRoom>
      )}
    </main>
  );
}

function WelcomeScreen({ onConnect, isConnecting }: { onConnect: () => void; isConnecting: boolean }) {
  return (
    <div className="h-full flex items-center justify-center p-4 bg-black">
      <Card className="w-full max-w-2xl border-2 max-h-[calc(100vh-4rem)]">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🏎️</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Adrian</h1>
              <p className="text-xl text-muted-foreground">
                Your F1 Race Engineer
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 py-4">
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium text-sm">Championship Calculations</div>
                <div className="text-xs text-muted-foreground">Points scenarios & predictions</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="font-medium text-sm">Pit Stop Analysis</div>
                <div className="text-xs text-muted-foreground">Time loss calculations</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <div className="text-2xl mb-2">📋</div>
                <div className="font-medium text-sm">FIA Regulations</div>
                <div className="text-xs text-muted-foreground">Instant rule lookups</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-medium text-sm">Race Strategy</div>
                <div className="text-xs text-muted-foreground">Expert recommendations</div>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Button
                onClick={onConnect}
                disabled={isConnecting}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-5 w-5" />
                    Start Call with Adrian
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                <Mic className="inline w-3 h-3 mr-1" />
                Microphone access required
              </p>
            </div>

            {/* Example Questions */}
            <div className="pt-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Example questions:</p>
              <div className="grid gap-2 text-sm">
                <div className="bg-muted/30 rounded-md p-3 text-left border">
                  <p className="text-muted-foreground">
                    "If Max has 400 points and Lando has 350 with 3 races left, can Lando win?"
                  </p>
                </div>
                <div className="bg-muted/30 rounded-md p-3 text-left border">
                  <p className="text-muted-foreground">
                    "What's the F1 points system?"
                  </p>
                </div>
                <div className="bg-muted/30 rounded-md p-3 text-left border">
                  <p className="text-muted-foreground">
                    "How much time does a pit stop cost at Monaco?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChatInterface({ onDisconnect }: { onDisconnect: () => void }) {
  const { state, audioTrack } = useVoiceAssistant();
  const room = useRoomContext();
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Listen for transcriptions
  useEffect(() => {
    if (!room) return;

    const handleTranscription = (
      segments: TranscriptionSegment[],
      participant?: any
    ) => {
      segments.forEach((segment) => {
        if (segment.final && segment.text.trim()) {
          const isAssistant = participant?.identity?.includes('agent') || 
                             participant?.name?.includes('Adrian') ||
                             !participant;
          
          setMessages((prev) => [
            ...prev,
            {
              role: isAssistant ? 'assistant' : 'user',
              content: segment.text,
              timestamp: new Date(),
            },
          ]);
        }
      });
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);

    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }, [audioTrack]);

  const getStateInfo = () => {
    switch (state) {
      case 'listening':
        return { icon: Mic, text: 'Listening', color: 'bg-green-500' };
      case 'thinking':
        return { icon: Loader2, text: 'Thinking', color: 'bg-yellow-500', spin: true };
      case 'speaking':
        return { icon: Radio, text: 'Speaking', color: 'bg-blue-500' };
      default:
        return { icon: MicOff, text: 'Idle', color: 'bg-gray-500' };
    }
  };

  const stateInfo = getStateInfo();
  const StateIcon = stateInfo.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
              <span className="text-xl">🏎️</span>
            </div>
            <div>
              <h2 className="font-semibold">Adrian</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stateInfo.color} ${stateInfo.spin ? 'animate-spin' : 'animate-pulse'}`} />
                <span className="text-xs text-muted-foreground">{stateInfo.text}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={onDisconnect}
            variant="destructive"
            size="sm"
            className="gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="container max-w-4xl py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Mic className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Start speaking to begin your conversation with Adrian
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-10 h-10 border-2 border-red-500">
                    <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-700 text-white">
                      🏎️
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {message.role === 'assistant' ? 'Adrian' : 'You'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>

                {message.role === 'user' && (
                  <Avatar className="w-10 h-10 border-2 border-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      👤
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Status Bar */}
      <div className="border-t bg-muted/50">
        <div className="container max-w-4xl py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={state === 'listening' ? 'default' : 'secondary'} className="gap-1">
                <StateIcon className={`w-3 h-3 ${stateInfo.spin ? 'animate-spin' : ''}`} />
                {stateInfo.text}
              </Badge>
              {audioTrack && (
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Connected
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Speak naturally • Adrian is listening
            </p>
          </div>
        </div>
      </div>

      <RoomAudioRenderer />
    </div>
  );
}