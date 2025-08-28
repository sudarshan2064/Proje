"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Room } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createRoom, joinRoom } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Users, Loader2 } from "lucide-react";

const formSchema = z.object({
  roomName: z.string().min(3, "Room name must be at least 3 characters").max(50, "Room name is too long"),
});

export default function LobbyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomName: "",
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const q = query(collection(db, "rooms"), where("status", "==", "waiting"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomsData);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateRoom = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setIsCreating(true);
    try {
      const newRoomId = await createRoom(values.roomName, user);
      toast({ title: "Room created!", description: `Room "${values.roomName}" has been created.` });
      router.push(`/room/${newRoomId}`);
    } catch (error) {
      console.error("Error creating room:", error);
      toast({ title: "Error", description: "Failed to create room.", variant: "destructive" });
    } finally {
      setIsCreating(false);
      setOpen(false);
      form.reset();
    }
  };
  
  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;
    setIsJoining(roomId);
    try {
      await joinRoom(roomId, user);
      toast({ title: "Joined room!" });
      router.push(`/room/${roomId}`);
    } catch (error: any) {
      console.error("Error joining room:", error);
      toast({ title: "Error", description: error.message || "Failed to join room.", variant: "destructive" });
      setIsJoining(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Game Lobby</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Room</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Trivia Room</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateRoom)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="roomName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 'Brainiacs Unite'" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <Card key={room.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{room.name}</CardTitle>
                <CardDescription>Created by {room.host.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{room.players.length} / 6 players</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleJoinRoom(room.id)} disabled={isJoining === room.id || room.players.length >= 6}>
                  {isJoining === room.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Room"}
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground py-10">
            <p>No active rooms. Why not create one?</p>
          </div>
        )}
      </div>
    </div>
  );
}
