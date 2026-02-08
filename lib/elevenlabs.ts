/*
lib/elevenlabs.ts

Purpose:
- Integration with ElevenLabs API for text-to-speech
- Generates motivational audio messages
*/

export async function generateMotivationalSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }

  // Use a motivational voice ID (you can change this to any ElevenLabs voice ID)
  // Default: "21m00Tcm4TlvDq8ikWAM" (Rachel - friendly, motivational)
  // Other options: "pNInz6obpgDQGcFmaJgB" (Adam - deep, inspiring)
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1", // or "eleven_multilingual_v2" for multilingual
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5, // More expressive
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  return await response.arrayBuffer();
}

export function generateMotivationalMessage(context: {
  progress?: number;
  completedTasks?: number;
  totalTasks?: number;
  nextTask?: string;
  goalText?: string;
}): string {
  const { progress = 0, completedTasks = 0, totalTasks = 0, nextTask, goalText } = context;

  // Generate different messages based on progress
  if (progress === 0) {
    return `Welcome to your journey! You're about to embark on an incredible path toward ${goalText || "your goal"}. Remember, every great achievement starts with a single step. You've got this!`;
  } else if (progress < 25) {
    return `Great start! You've completed ${completedTasks} of ${totalTasks} waypoints. You're building momentum, and that's what matters. Keep pushing forward, one step at a time.`;
  } else if (progress < 50) {
    return `You're making excellent progress! ${progress}% complete. You're proving to yourself that you can do this. ${nextTask ? `Your next step: ${nextTask}.` : ""} Keep climbing!`;
  } else if (progress < 75) {
    return `You're over halfway there! ${progress}% complete. This is where champions are made. You've come too far to give up now. ${nextTask ? `Focus on: ${nextTask}.` : ""} You've got this!`;
  } else if (progress < 100) {
    return `You're in the final stretch! ${progress}% complete. The summit is in sight. Every step you take now brings you closer to your goal. ${nextTask ? `One more push: ${nextTask}.` : ""} Finish strong!`;
  } else {
    return `Congratulations! You've reached the summit! You've completed all ${totalTasks} waypoints. This is a moment to celebrate. You've shown incredible dedication and perseverance. Well done!`;
  }
}

