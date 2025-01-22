import Together from "together-ai";

// Set the runtime to edge for best performance
export const runtime = 'edge';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  console.log(`prompt: ${prompt}`)

  const client = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
  });

  let response;
  try {
    response = await client.images.create({
      prompt: `In the flat design style, create:\n ${prompt}`,
      model: "black-forest-labs/FLUX.1-schnell",
      width: 1024,
      height: 768,
      steps: 3,
      response_format: "base64",
    });
  } catch (e: any) {
    return Response.json(
      { error: e.toString() },
      {
        status: 500,
      }
    );
  }

  return Response.json(response.data[0]);
}
