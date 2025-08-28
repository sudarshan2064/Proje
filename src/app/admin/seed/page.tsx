"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { seedQuestions } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database } from "lucide-react";

export default function SeedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      const result = await seedQuestions();
      toast({
        title: "Database Seeding",
        description: result.message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seed questions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database />
            Seed Database
          </CardTitle>
          <CardDescription>
            Populate your Firestore database with an initial set of trivia questions. This is only needed once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeed} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              "Seed Questions"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
