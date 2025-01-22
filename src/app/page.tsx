"use client";

import { useCompletion, useChat, Message } from "ai/react";
import { useState, useEffect, MouseEventHandler } from "react";
import Image from "next/image";
import { parse } from "best-effort-json-parser";
import { type } from "os";

type ImageResponse = {
  b64_json: string;
  timings: { inference: number };
};

interface TypeCounter {
  [key: string]: number;
}

const MAX_QUESTIONS = 10;

export default function Chat() {
  // const {completion, input, setInput, handleSubmit } = useCompletion({
  //   api: '/api/together-ai'
  // });

  let choicePrompt: string;
  let firstChoice: boolean;
  const [word, setWord] = useState("");
  const [questionReady, setQuestionReady] = useState(true);
  const [imageB64, setImageB64] = useState("");
  const [] = useState(false);
  const currentUrl = window.location.href;

  const [question, setQuestion] = useState({ background: "", choices: [""] });
  const [number, setNumber] = useState(0);
  const [typeCounter, setTypeCounter] = useState<TypeCounter>({
    introversion: 0,
    extraversion: 0,
    judging: 0,
    perceiving: 0,
    sensing: 0,
    intuition: 0,
    thinking: 0,
    feeling: 0,
  });

  const { messages, handleSubmit, reload, append } = useChat({
    api: `${currentUrl}/api/chatgpt`,
    onFinish: async (message: Message) => {
      try {
        const response = await fetch("/api/generateImages", {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({ prompt: document.getElementById("background")?.textContent }),
        });
        let imageRes = (await response.json()) as ImageResponse;
        setImageB64(imageRes.b64_json);
      } catch (error) {
        console.error(error);
      } finally {
        setQuestionReady(true);
      }
    },
    onError: (error: Error) => {
      console.error("Error from API", error);
      alert("Error");
    },
    // initialMessages:  // Maybe can be used for the default prompt
  });

  useEffect(() => {
    if (messages.length > 0 && messages.length % 2 == 0) {
      const message = messages[messages.length - 1];
      try {
        const json_message = parse(message.content);
        setQuestion(json_message);
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.log("Error while parsing model json response", error);
        } else {
          console.error("Error with parser", error);
        }
      }
    }
  }, [messages]);

  useEffect(() => {
    console.log(question);
  }, [question]);

  const classifyChoices = async () => {
    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({ question: question }),
      });
      const results = await response.json();
      const classResult: Array<string> = firstChoice
        ? results["choice_1"]
        : results["choice_2"];
      console.log(question.choices);
      console.log(results);
      console.log(firstChoice ? question.choices[0] : question.choices[1]);
      console.log(classResult);
      classResult.forEach((type: string) => {
        setTypeCounter((prevTypeCounter) => ({
          ...prevTypeCounter,
          [type]: typeCounter[type] + 1,
        }));
      });
    } catch (error) {
      console.error(error);
    }
  };

  const onChoice: MouseEventHandler<HTMLButtonElement> = (event) => {
    const html = event.target as HTMLElement;
    const choice = html.textContent;
    firstChoice = choice == question.choices[0];
    choicePrompt = `Continue the interactive story with the choice: \n ${choice} \n The output needs to be JSON formatted. Here is a template of the format: { background: "Write the background in 100 characters", choices: ["Write choice 1 in 100 characters.", "Write choice 1 in 100 characters."] \n Important instructions: \n You must keep the background short`;
    onClickNext();
  };

  const onClickNext = async () => {
    // Prevents user from double clicking
    if (questionReady == true) {
      setQuestionReady(false);
      setNumber(number + 1);

      let content;
      if (number == 0) {
        const prompt = `Start the interactive story related to ${word}. The output needs to be JSON formatted. Here is a template of the format: { background: "Write the background in 100 characters", choices: ["Write choice 1 in 100 characters.", "Write choice 1 in 100 characters."] }`;
        content = prompt;
      } else {
        classifyChoices();
        content = choicePrompt;
      }

      try {
        await append({ role: "user", content: content });
      } catch (error) {
        console.error("Error on append", error); // NEEDS TESTING
      }
    }
  };

  function PersonalityTest(): JSX.Element {
    if (number == 0) {
      return (
        <form
          id="insertWord"
          onSubmit={(event) => {
            event.preventDefault();
            onClickNext();
          }}
          className="flex flex-col"
        >
          <input
            form="insertWord"
            className="w-1/2 max-w-md p-2 border border-gray-300 rounded shadow-xl"
            value={word}
            placeholder="Type a one word noun..."
            onChange={(event) => setWord(event.target.value as string)}
          />
          <button
            form="insertWord"
            type="submit"
            className="mt-8 text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-sm py-2.5 w-20"
          >
            Next
          </button>
        </form>
      );
    } else if (number > 0 && number <= MAX_QUESTIONS) {
      return (
        <div>
          <Image
            width={1024}
            height={768}
            src={`data:image/png;base64,${imageB64}`}
            alt=""
            className="max-w-full"
          />
          <div id="background" className="mb-2">
            {question.hasOwnProperty("background") ? question.background : ""}
          </div>
          {question.hasOwnProperty("choices")
            ? question.choices !== undefined && question.background.length > 0
              ? question.choices.map((choice, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={onChoice}
                    className="text-left text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 me-2 my-2"
                  >
                    {choice}
                  </button>
                ))
              : ""
            : ""}
        </div>
      );
    } else if (number == MAX_QUESTIONS + 1) {
      return (
        <div>
          {typeCounter.introversion > typeCounter.extraversion ? "I" : "E"}
          {typeCounter.intuition > typeCounter.sensing ? "N" : "S"}
          {typeCounter.feeling > typeCounter.thinking ? "F" : "T"}
          {typeCounter.perceiving > typeCounter.judging ? "P" : "J"}
        </div>
      );
    } else {
      return <p> Page Not Avaiable </p>;
    }
  }

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <p className="fixed top-2 left-2"> {number} </p>

      {PersonalityTest()}
    </div>
  );
}
