'use server';

/**
 * @fileOverview Adjusts trivia game difficulty based on player performance.
 *
 * - adjustDifficulty - A function that adjusts the difficulty of trivia questions.
 * - AdjustDifficultyInput - The input type for the adjustDifficulty function.
 * - AdjustDifficultyOutput - The return type for the adjustDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustDifficultyInputSchema = z.object({
  playerPerformance: z
    .number()
    .describe(
      'The player performance score. Higher values indicate better performance.'
    ),
  questionDifficulty: z
    .number()
    .describe(
      'The difficulty of the current question on a scale from 1 (easy) to 10 (hard).'
    ),
  desiredDifficultyChange: z.number().describe('The desired step change in the difficulty of the question. Positive means harder, Negative means easier.'),
});
export type AdjustDifficultyInput = z.infer<typeof AdjustDifficultyInputSchema>;

const AdjustDifficultyOutputSchema = z.object({
  adjustedDifficulty: z
    .number()
    .describe(
      'The adjusted difficulty of the next question, on a scale from 1 (easy) to 10 (hard).'
    ),
  reason: z
    .string()
    .describe('The reason for adjusting the difficulty in short sentence.'),
});
export type AdjustDifficultyOutput = z.infer<typeof AdjustDifficultyOutputSchema>;

export async function adjustDifficulty(input: AdjustDifficultyInput): Promise<AdjustDifficultyOutput> {
  return adjustDifficultyFlow(input);
}

const adjustDifficultyPrompt = ai.definePrompt({
  name: 'adjustDifficultyPrompt',
  input: {schema: AdjustDifficultyInputSchema},
  output: {schema: AdjustDifficultyOutputSchema},
  prompt: `You are an expert game balancer, responsible for adjusting the difficulty of trivia questions in a game.

  Based on the player's performance and the current question's difficulty, you will determine the adjusted difficulty for the next question.

  Player Performance: {{playerPerformance}}
Current Question Difficulty: {{questionDifficulty}}
 Desired difficulty change: {{desiredDifficultyChange}}

  Consider these factors:
  - If the player's performance is high, increase the difficulty.
  - If the player's performance is low, decrease the difficulty.
  - The difficulty should be between 1 and 10.

  Return the adjusted difficulty and a brief reason for the adjustment.
  Do not include any preamble or explanations.
  Focus on being concise.
`,
});

const adjustDifficultyFlow = ai.defineFlow(
  {
    name: 'adjustDifficultyFlow',
    inputSchema: AdjustDifficultyInputSchema,
    outputSchema: AdjustDifficultyOutputSchema,
  },
  async input => {
    const {output} = await adjustDifficultyPrompt(input);
    return output!;
  }
);
