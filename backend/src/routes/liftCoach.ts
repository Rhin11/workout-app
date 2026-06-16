import { Router, type Request, type Response } from 'express';

const router = Router();

const SYSTEM_PROMPT = `You are an experienced strength and conditioning coach embedded in a workout logging app called FORGE.

Your role:
- Explain lifts clearly: setup, execution, breathing, and what good reps look like.
- Name the primary and secondary muscles involved.
- Call out common mistakes and practical cues to improve form.
- Suggest sensible progressions or alternatives when appropriate.

Rules:
- Keep answers concise and actionable (a few short paragraphs unless the user asks for more depth).
- Use plain language; avoid jargon unless you briefly explain it.
- Never diagnose injuries or prescribe rehabilitation. If pain or injury comes up, tell them to stop and consult a qualified professional.
- Do not recommend specific loads, maxes, or programming that could be unsafe without knowing their training history.
- If an exercise name is ambiguous or obscure, say what you think it is and note any uncertainty.`;

const UNAVAILABLE_MESSAGE = 'The coach is unavailable right now — try again in a moment.';

router.post('/', async (req: Request, res: Response) => {
  const exerciseName = typeof req.body?.exerciseName === 'string' ? req.body.exerciseName.trim() : '';
  const userQuestion =
    typeof req.body?.userQuestion === 'string' ? req.body.userQuestion.trim() : '';

  if (!exerciseName || !userQuestion) {
    res.status(400).json({ error: 'exerciseName and userQuestion are required' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    res.status(500).json({ error: UNAVAILABLE_MESSAGE });
    return;
  }

  const content = `The user is viewing the exercise "${exerciseName}" in their workout app. Their question: ${userQuestion}`;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!anthropicRes.ok) {
      const body = await anthropicRes.text();
      console.error('Anthropic API error', anthropicRes.status, body);
      res.status(502).json({ error: UNAVAILABLE_MESSAGE });
      return;
    }

    const data = (await anthropicRes.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const reply = data.content?.[0]?.text ?? '';
    res.json({ reply });
  } catch (err) {
    console.error('Lift coach error', err);
    res.status(500).json({ error: UNAVAILABLE_MESSAGE });
  }
});

export default router;
