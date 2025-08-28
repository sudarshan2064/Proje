
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { db, rtdb } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ref, onValue, off, set } from "firebase/database";
import { Room, Question, Player } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Trophy, Sparkles } from 'lucide-react';
import { startGame, submitAnswer, nextQuestion } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { adjustDifficulty } from '@/ai/flows/adjust-difficulty';

const WinnerCelebration = () => {
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; delay: number; duration: number; size: number }[]>([]);

  useEffect(() => {
    const newSparks = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 1,
      duration: Math.random() * 2 + 1, // duration between 1 and 3 seconds
      size: Math.random() * 16 + 16 // size between 16 and 32
    }));
    setSparks(newSparks);
  }, []);

  if (sparks.length === 0) return null;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {sparks.map(spark => (
        <Sparkles
          key={spark.id}
          className="absolute text-yellow-400 animate-fade-out-up"
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            width: `${spark.size}px`,
            height: `${spark.size}px`,
            animationDelay: `${spark.delay}s`,
            animationDuration: `${spark.duration}s`,
          }}
        />
      ))}
    </div>
  );
};


export default function RoomPage({ params }: { params: { roomId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { roomId } = params;

  const [room, setRoom] = useState<Room | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [scores, setScores] = useState<Record<string, Player>>({});
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(20);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  useEffect(() => {
    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribeRoom = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const roomData = { id: doc.id, ...doc.data() } as Room;
        setRoom(roomData);
        if (roomData.status === 'playing') {
          const questionId = roomData.questionIds[roomData.currentQuestionIndex];
          if (questionId) {
            const questionRef = doc(db, 'questions', questionId);
            onSnapshot(questionRef, (qDoc) => {
              if (qDoc.exists()) {
                setQuestion({ id: qDoc.id, ...qDoc.data() } as Question);
              }
            });
          }
        }
      } else {
        toast({ title: "Error", description: "Room not found.", variant: 'destructive' });
        router.push('/');
      }
      setLoading(false);
    });

    const scoresRef = ref(rtdb, `scores/${roomId}`);
    const onScoresValue = onValue(scoresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setScores(data);
      }
    });

    return () => {
      unsubscribeRoom();
      off(scoresRef, 'value', onScoresValue);
    };
  }, [roomId, router, toast]);

  useEffect(() => {
    if (room?.status === 'playing' && !showAnswer) {
      setTimer(20);
      setSelectedAnswer(null);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            setShowAnswer(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [room?.status, room?.currentQuestionIndex, showAnswer]);
  
  useEffect(() => {
      if (room?.status === 'finished') {
          const sortedScores = Object.values(scores).sort((a, b) => b.score - a.score);
          if (sortedScores.length > 0 && user?.uid === sortedScores[0].uid) {
              setIsWinner(true);
          }
      }
  }, [room?.status, scores, user]);


  const handleStartGame = async () => {
    if (!user) return;
    setIsStarting(true);
    try {
      await startGame(roomId, user.uid);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsStarting(false);
    }
  };
  
  const handleNextQuestion = async () => {
    if (!user) return;
    setShowAnswer(false);
    
    // AI difficulty adjustment
    const answers = room?.answers?.[question!.id] ?? {};
    const correctCount = Object.values(answers).filter(a => a.isCorrect).length;
    const performance = room!.players.length > 0 ? (correctCount / room!.players.length) * 10 : 5;

    try {
      const result = await adjustDifficulty({
        playerPerformance: performance,
        questionDifficulty: question!.difficulty,
        desiredDifficultyChange: 0,
      });
      console.log('AI adjusted difficulty:', result);
      toast({
        title: "AI Difficulty Adjustment",
        description: `Next question difficulty aimed at ${result.adjustedDifficulty.toFixed(1)}/10. ${result.reason}`,
      });
    } catch (e) {
      console.error("AI adjustment failed", e);
    }
    
    await nextQuestion(roomId, user.uid);
  }

  const handleAnswerSubmit = async (answerIndex: number) => {
    if (!user || !question) return;
    setSelectedAnswer(answerIndex);
    setIsSubmitting(true);
    try {
      await submitAnswer(roomId, user.uid, question.id, answerIndex);
      toast({ title: 'Answer submitted!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setShowAnswer(true);
    }
  };
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const sortedScores = useMemo(() => Object.values(scores).sort((a, b) => b.score - a.score), [scores]);

  if (loading || authLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  if (!room) {
    return <div className="text-center">Room not found.</div>;
  }

  // Waiting Room
  if (room.status === 'waiting') {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">{room.name}</h1>
        <p className="text-muted-foreground text-center mb-8">Waiting for players to join...</p>
        <Card>
          <CardHeader>
            <CardTitle>Players ({room.players.length}/6)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {room.players.map(p => (
              <div key={p.uid} className="flex flex-col items-center gap-2">
                <Avatar>
                  <AvatarImage src={p.photoURL ?? ''} />
                  <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-center">{p.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        {user?.uid === room.host.uid && (
          <div className="mt-8 text-center">
            <Button onClick={handleStartGame} disabled={isStarting || room.players.length < 2} size="lg">
              {isStarting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</> : 'Start Game'}
            </Button>
            {room.players.length < 2 && <p className="text-sm text-muted-foreground mt-2">You need at least 2 players to start.</p>}
          </div>
        )}
      </div>
    );
  }
  
  // Results Screen
  if (room.status === 'finished') {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="relative inline-block my-4">
          {isWinner && <WinnerCelebration />}
          <Trophy className="w-24 h-24 text-yellow-400 drop-shadow-lg" />
        </div>
        <h1 className="text-4xl font-bold mt-4">Game Over!</h1>
        <p className="text-xl text-muted-foreground mt-2">
          {sortedScores.length > 0 ? `${sortedScores[0].name} is the winner!` : 'No winner determined.'}
        </p>
        <Card className="mt-8 text-left">
          <CardHeader><CardTitle>Final Scores</CardTitle></CardHeader>
          <CardContent>
            {sortedScores.map((p, index) => (
              <div key={p.uid} className="flex items-center justify-between p-2 rounded-lg mb-2 bg-secondary/50">
                 <div className="flex items-center gap-4">
                  <span className="font-bold w-6">{index === 0 ? <Crown className="text-yellow-500"/> : `${index + 1}.`}</span>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.photoURL ?? ''} />
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{p.name}</span>
                </div>
                <span className="font-bold text-lg text-primary">{p.score} pts</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Button onClick={() => router.push('/')} className="mt-8" size="lg">Back to Lobby</Button>
      </div>
    );
  }

  // Gameplay
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {question ? (
          <Card className="min-h-[400px] flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                 <CardTitle>Question {room.currentQuestionIndex + 1} / {room.questionIds.length}</CardTitle>
                 <Badge variant="outline" className="text-base">Difficulty: {question.difficulty}</Badge>
              </div>
              <Progress value={(timer / 20) * 100} className="w-full h-2 [&>div]:bg-accent" />
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center">
              <p className="text-2xl font-semibold text-center mb-8">{question.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option, index) => {
                  const isCorrect = index === question.correctAnswer;
                  const isSelected = index === selectedAnswer;
                  let variantClass = "bg-card hover:bg-secondary";
                  if (showAnswer) {
                     if (isCorrect) variantClass = "bg-green-500/80 text-white";
                     else if (isSelected && !isCorrect) variantClass = "bg-red-500/80 text-white";
                     else variantClass = "bg-secondary/80";
                  }

                  return (
                    <Button
                      key={index}
                      onClick={() => handleAnswerSubmit(index)}
                      disabled={selectedAnswer !== null || showAnswer}
                      className={`h-auto py-4 text-wrap text-md justify-start ${variantClass}`}
                    >
                      <span className="font-bold mr-4">{String.fromCharCode(65 + index)}</span>
                      {option}
                    </Button>
                  );
                })}
              </div>
              {showAnswer && user?.uid === room.host.uid && (
                <div className="text-center mt-8">
                  <Button onClick={handleNextQuestion} size="lg">Next Question <Sparkles className="ml-2 h-4 w-4"/></Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}
      </div>
      <div>
        <Card>
          <CardHeader><CardTitle>Scoreboard</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {sortedScores.map((p, index) => (
              <div key={p.uid} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Avatar className="h-10 w-10">
                    <AvatarImage src={p.photoURL ?? ''} />
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{p.name} {index === 0 && '👑'}</span>
                </div>
                <span className="font-bold text-lg text-primary">{p.score}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
