import ChatCompletionMessageParam, { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { NextRequest, NextResponse } from 'next/server'
 
// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.CHATGPT_API_KEY
});
 
// Set the runtime to edge for best performance
export const runtime = 'edge';
 
export async function POST(req: NextRequest) {
  const { question } = await req.json();

  const messages: ChatCompletionMessageParam.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: ["You are an AI made for classifying answers into personality traits. You will be given two choices ",
        "and you will classify the choices with ONE of these Myers Briggs 'classification words': ['introversion', 'extraversion', 'perceiving', 'judging', 'sensing', 'intuition', ", 
        "'thinking', 'feeling']. Additionaly the following pairs are opposites of each other introversion/extraversion, perceiving/judging, sensing/intuition, thinking/feeling.\n",
        "Here is the description of each classification:\n",
        "1) 'Sensing' focus on their five senses and are interested in information they can directly see, hear, feel, and so on. They tend to be hands-on learners and are often described as practical.\n",
        "2) Intuitives focus on a more abstract level of thinking; they are more interested in theories, patterns, and explanations. They are often more concerned with the future than the present and are often described as creative.",
        "3) Thinkers tend to make decisions with their heads; they are interested in finding the most logical, reasonable choice.",
        "4) Feelers tend to make decisions with their hearts; they are interested in how a decision will affect people, and whether it fits in with their values.",
        "5) Judgers appreciate structure and order; they like things planned, and dislike last-minute changes.",
        "6) Perceivers appreciate flexibility and spontaneity; they like to leave things open so they can change their minds",
        "7) Introverts are energized by spending quiet time alone or with a small group. They tend to be more reserved and thoughtful",
        "8) Extraverts are energized by spending time with people and in busy, active surroundings. They tend to be more expressive and outspoken.",
        "You will respond to prompt in the format:\n { choice_1: ['classification word'], choice_2: ['classification word'] }"].join(" ") },
    { role: "user", content: ["Classify the choices into json format:\n { background: \"You find yourself waking up on a train. The weather looks rather nice",
      "outside. After taking it in for a bit, you decide to...\", choices: [\"not think about where the next stop",
      "is, and embrace the excitement of the unknown.\", \"look for the route map, and find out where the",
      "train is heading.\"] }"].join(" ") },
    { role: "assistant", content: ["{ choice_1: ['feeling'], choice_2: ['thinking'] }"].join(" ") },
    { role: "user", content: ["Classify the choices into json format:\n { background: \"Soon after, you see a mountain, with a number of villages scattered across the",
      "mountainside. You decide to get off the train and check it out. You would enjoy the visit if...\", choices: [\"it",
      "has a lively vibe; you get to shop around and talk to the locals.\", \"it has a peaceful vibe; there are",
      "only some locals around, busy with their daily activities.\"] }"].join(" ") },
    { role: "assistant", content: ["{ choice_1: ['extraversion'], choice_2: ['introversion'] }"].join(" ") },
    { role: "user", content: ["Classify the choices into json format:\n { background: \"You need to pass through a cave to reach the village. Right before you step in",
      "the cave, a litter of kittens bolted out...\", choices: [\"Phew... thank God it's just cats, not some deadly ",
      "animal...\", \"They are still kittens... I wonder where they are going...\"] }"].join(" ") },
    { role: "assistant", content: ["{ choice_1: ['sensing'], choice_2: ['intuition'] }"].join(" ") },
    { role: "user", content: [`Classify the choices into json format:\n ${JSON.stringify(question)}`].join(" ") },
  ]

  console.log(messages)

  try {
    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        stream: true,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: messages,
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response) 

    // Respond with the stream
    return new StreamingTextResponse(stream, {status: 200})
  } 
  catch (error) {
    console.error('OpenAI API error:', error)

    return NextResponse.json( { error: error}, {status: 500})
  }
}