import { Move } from '@/types/game';
import { AICoachAnalysis, AICoachScore } from '@/types/game';

export async function analyzeGame(moveHistory: Move[]): Promise<AICoachAnalysis> {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
    return getFallbackAnalysis(moveHistory);
  }

  const moveLog = moveHistory
    .map((m, i) => {
      const from = m.from === 'bar' ? 'bar' : `point ${(m.from as number) + 1}`;
      const to = m.to === 'bearoff' ? 'bear off' : `point ${(m.to as number) + 1}`;
      const hit = m.hitBlot ? ' (hit a blot!)' : '';
      return `Move ${i + 1} [Turn ${m.turnNumber}, ${m.player}]: ${from} → ${to} using die ${m.dieUsed}${hit}`;
    })
    .join('\n');

  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert backgammon coach. Analyze this game move by move and give specific, actionable feedback. Be concise. Reference specific moves by number. Return JSON with fields: score (one of: Beginner, Intermediate, Advanced, Expert) and insights (array of 3-5 strings, each referencing specific move numbers and explaining what was good or bad).',
          },
          {
            role: 'user',
            content: `Analyze this backgammon game:\n\n${moveLog}\n\nReturn valid JSON only.`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error('OpenAI API error');

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    return {
      score: parsed.score as AICoachScore,
      insights: Array.isArray(parsed.insights) ? parsed.insights : [parsed.insights],
    };
  } catch {
    return getFallbackAnalysis(moveHistory);
  }
}

function getFallbackAnalysis(moveHistory: Move[]): AICoachAnalysis {
  const hits = moveHistory.filter(m => m.hitBlot).length;
  const barMoves = moveHistory.filter(m => m.from === 'bar').length;
  const bearOffMoves = moveHistory.filter(m => m.to === 'bearoff').length;
  const totalMoves = moveHistory.length;

  const insights: string[] = [];

  if (hits > 0) {
    const hitMoves = moveHistory.filter(m => m.hitBlot).map((m, i) => moveHistory.indexOf(m) + 1);
    insights.push(
      `Move${hitMoves.length > 1 ? 's' : ''} ${hitMoves.slice(0, 2).join(', ')}: Hitting opponent blots is an aggressive and often correct strategy — well played!`
    );
  } else {
    insights.push('Consider being more aggressive — hitting opponent blots forces them to re-enter from the bar and wastes their turns.');
  }

  if (barMoves > 2) {
    insights.push(`You spent ${barMoves} moves re-entering from the bar. Avoiding blots in your opponent's home board is critical.`);
  }

  if (bearOffMoves > 0) {
    insights.push(`You reached the bear-off phase after ${totalMoves - bearOffMoves} moves — ${totalMoves - bearOffMoves < 25 ? 'an impressive pace' : 'try to move your back checkers earlier'}.`);
  }

  insights.push('Building consecutive blocked points (a prime) is one of the strongest strategies in backgammon — aim for 4+ consecutive points.');

  if (totalMoves > 0) {
    insights.push(`Game completed in ${totalMoves} total moves. Focus on pip count efficiency — every wasted move gives your opponent an advantage.`);
  }

  let score: AICoachScore = 'Intermediate';
  if (hits >= 3 && bearOffMoves > 0) score = 'Advanced';
  else if (hits === 0 && barMoves > 3) score = 'Beginner';
  else if (hits >= 5 && totalMoves < 30) score = 'Expert';

  return { score, insights };
}
