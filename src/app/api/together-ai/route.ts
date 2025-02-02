import ChatCompletionMessageParam, { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
 
// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: process.env.TOGETHER_URL
});
 
// Set the runtime to edge for best performance
export const runtime = 'edge';
 
export async function POST(req: Request) {
  const { prompt } = await req.json();

  const default_prompt: ChatCompletionMessageParam.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: ["You are a writer for an interactive story. You will start each adventure with",
        "background and then offer two choices. The background need to be short, 200 characters at most. You will",
        "not respond to prompt with \"great choice\". You respond in the format:\n { background: \"background\", choices: [\"choice",
        "1\", \"choice 2\"] }"].join(" ") },
    { role: "user", content: ["Start the interactive story in a train. \n The output needs to be JSON formatted. Here is a template",
        "of the format: { background: \"Write the background in 200 characters\", choices: [\"Write choice 1 in 100 characters.\",",
        "\"Write choice 1 in 100 characters.\"] }"].join(" ") },
    { role: "assistant", content: ["{ background: \"You find yourself waking up on a train. The weather looks rather nice",
        "outside. After taking it in for a bit, you decide to...\", choices: [\"not think about where the next stop",
        "is, and embrace the excitement of the unknown.\", \"look for the route map, and find out where the",
        "train is heading.\"] }"].join(" ") },
    { role: "user", content: ["Continue the interactive story with the choice:\n look for the route map,",
        "and find out where the train is heading. \n The output needs to be JSON formatted. Here is a template",
        "of the format: { background: \"Write the background in 200 characters\", choices: [\"Write choice 1 in 100 characters.\",",
        "\"Write choice 1 in 100 characters.\"] }"].join(" ") },
    { role: "assistant", content: ["{ background: \"Soon after, you see a mountain, with a number of villages scattered across the",
        "mountainside. You decide to get off the train and check it out. You would enjoy the visit if...\", choices: [\"it",
        "has a lively vibe; you get to shop around and talk to the locals.\", \"it has a peaceful vibe; there are",
        "only some locals around, busy with their daily activities.\"] }"].join(" ") },
    { role: "user", content: ["Start the interactive story in a cave. \n The output needs to be JSON formatted. Here is a template",
        "of the format: { background: \"Write the background in 200 characters\", choices: [\"Write choice 1 in 100 characters.\",",
        "\"Write choice 1 in 100 characters.\"] }"].join(" ") },    
    { role: "assistant", content: ["{ background: \"You need to pass through a cave to reach the village. Right before you step in",
        "the cave, a litter of kittens bolted out...\", choices: [\"Phew... thank God it's just cats, not some deadly ",
        "animal...\", \"They are still kittens... I wonder where they are going...\"] }"].join(" ") },
    { role: "user", content: ["Continue the interactive story with the choice:\n Phew... thank God it's",
        "just cats, not some deadly animal... \n The output needs to be JSON formatted. Here is a template",
        "of the format: { background: \"Write the background in 200 characters\", choices: [\"Write choice 1 in 100 characters.\",",
        "\"Write choice 1 in 100 characters.\"] }"].join(" ") },
    { role: "assistant", content: ["{ background: \"You walk into the cave and see a giant bird. It looks upset and it's spreading",
        "strong, negative energies...\", choices: [\"Ugh... Why is there a giant bird? Should I run?\", \"Oh, the bird",
        "seems upset. Should I ask what happened?\"] }"].join(" ") },
  ]

  console.log(prompt)
 
  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: 'meta-llama/Llama-2-70b-chat-hf',
    stream: true,
    max_tokens: 300,
    messages: [...default_prompt,
        { role: "user", content: prompt as string}
    ],
  });

  // for await (const chunk of response) {
  //   console.log(chunk.choices[0]?.delta?.content)
  // }
 
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response) 

  // console.log(stream)

  // Respond with the stream
  return new StreamingTextResponse(stream);
}