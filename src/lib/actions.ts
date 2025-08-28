"use server";

import { revalidatePath } from "next/cache";
import { db, rtdb } from "./firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  getDoc,
  query,
  where,
  getDocs,
  writeBatch,
  limit
} from "firebase/firestore";
import { ref, set } from "firebase/database";
import { Player, Room, UserProfile, Question } from "@/types";

export async function createRoom(roomName: string, user: UserProfile): Promise<string> {
  if (!user) throw new Error("User not authenticated");

  const player: Player = {
    uid: user.uid,
    name: user.name || "Anonymous",
    photoURL: user.photoURL || null,
    score: 0,
  };

  const roomRef = await addDoc(collection(db, "rooms"), {
    name: roomName,
    host: { uid: user.uid, name: user.name || "Anonymous" },
    players: [player],
    status: "waiting",
    createdAt: serverTimestamp(),
    currentQuestionIndex: 0,
    questionIds: [],
  });

  await set(ref(rtdb, `scores/${roomRef.id}/${user.uid}`), {
    name: player.name,
    photoURL: player.photoURL,
    score: 0,
  });
  
  revalidatePath("/");
  return roomRef.id;
}

export async function joinRoom(roomId: string, user: UserProfile) {
  if (!user) throw new Error("User not authenticated");

  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Room not found");
  }

  const room = roomSnap.data() as Room;

  if (room.players.length >= 6) {
    throw new Error("Room is full");
  }
  if (room.players.some((p) => p.uid === user.uid)) {
    // Already in room, do nothing
    return;
  }
  if (room.status !== 'waiting') {
    throw new Error("Game has already started");
  }

  const player: Player = {
    uid: user.uid,
    name: user.name || "Anonymous",
    photoURL: user.photoURL || null,
    score: 0,
  };

  await updateDoc(roomRef, {
    players: arrayUnion(player),
  });

  await set(ref(rtdb, `scores/${roomId}/${user.uid}`), {
    name: player.name,
    photoURL: player.photoURL,
    score: 0,
  });

  revalidatePath(`/room/${roomId}`);
}

export async function startGame(roomId: string, userId: string) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists() || roomSnap.data().host.uid !== userId) {
    throw new Error("Unauthorized or room not found");
  }
  if (roomSnap.data().players.length < 2) {
    throw new Error("Not enough players to start the game.");
  }

  // Fetch 5 random questions
  const questionsQuery = query(collection(db, "questions"), limit(5));
  const questionsSnap = await getDocs(questionsQuery);
  const questionIds = questionsSnap.docs.map(doc => doc.id);

  if (questionIds.length < 1) {
    throw new Error("Not enough questions in the database to start a game.");
  }
  
  await updateDoc(roomRef, {
    status: "playing",
    currentQuestionIndex: 0,
    questionIds: questionIds,
  });

  revalidatePath(`/room/${roomId}`);
}

export async function submitAnswer(roomId: string, userId: string, questionId: string, answerIndex: number) {
  const roomRef = doc(db, "rooms", roomId);
  const questionRef = doc(db, "questions", questionId);

  const [roomSnap, questionSnap] = await Promise.all([getDoc(roomRef), getDoc(questionRef)]);

  if (!roomSnap.exists() || !questionSnap.exists()) {
    throw new Error("Room or Question not found");
  }

  const question = questionSnap.data() as Question;
  const isCorrect = question.correctAnswer === answerIndex;
  
  const scoreRef = ref(rtdb, `scores/${roomId}/${userId}/score`);
  const currentScoreSnap = await getDoc(roomRef); // Not ideal, but RTDB get is complex on server
  const currentPlayer = currentScoreSnap.data()?.players.find((p: Player) => p.uid === userId);
  const currentScore = currentPlayer?.score || 0;

  if(isCorrect) {
    await set(scoreRef, currentScore + 10);
  }

  const answer = {
    userId,
    isCorrect,
    timestamp: serverTimestamp(),
  };

  await updateDoc(roomRef, {
    [`answers.${questionId}.${userId}`]: answer
  });
}

export async function nextQuestion(roomId: string, hostId: string) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists() || roomSnap.data().host.uid !== hostId) {
    throw new Error("Unauthorized or room not found");
  }

  const room = roomSnap.data() as Room;
  const newIndex = room.currentQuestionIndex + 1;

  if (newIndex >= room.questionIds.length) {
    await updateDoc(roomRef, { status: "finished" });
  } else {
    await updateDoc(roomRef, { currentQuestionIndex: newIndex });
  }
  revalidatePath(`/room/${roomId}`);
}


export async function seedQuestions() {
  const questionsCollection = collection(db, "questions");

  // Check if questions already exist to avoid duplicates
  const existingQuestions = await getDocs(query(questionsCollection, limit(1)));
  if (!existingQuestions.empty) {
    return { message: "Questions already seeded." };
  }

  const questions: Omit<Question, 'id'>[] = [
    { question: "What is the capital of France?", options: ["Berlin", "Madrid", "Paris", "Rome"], correctAnswer: 2, difficulty: 1 },
    { question: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correctAnswer: 1, difficulty: 2 },
    { question: "Who wrote 'To Kill a Mockingbird'?", options: ["Harper Lee", "Mark Twain", "F. Scott Fitzgerald", "Ernest Hemingway"], correctAnswer: 0, difficulty: 5 },
    { question: "What is the smallest prime number?", options: ["0", "1", "2", "3"], correctAnswer: 2, difficulty: 3 },
    { question: "In what year did the Titanic sink?", options: ["1905", "1912", "1918", "1923"], correctAnswer: 1, difficulty: 6 },
    { question: "What element does 'O' represent on the periodic table?", options: ["Gold", "Oxygen", "Osmium", "Oganesson"], correctAnswer: 1, difficulty: 2 },
    { question: "Who painted the Mona Lisa?", options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"], correctAnswer: 2, difficulty: 4 },
    { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3, difficulty: 3 },
    { question: "Which country is home to the kangaroo?", options: ["South Africa", "India", "Australia", "Brazil"], correctAnswer: 2, difficulty: 1 },
    { question: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Quartz"], correctAnswer: 2, difficulty: 7 },
  ];
  
  const batch = writeBatch(db);
  questions.forEach((question) => {
    const docRef = doc(questionsCollection);
    batch.set(docRef, question);
  });

  await batch.commit();

  return { message: `${questions.length} questions have been seeded.` };
}
