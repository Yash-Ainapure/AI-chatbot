"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChat } from "ai/react";
import { useRef, useEffect, useState } from "react";
import clsx from "clsx";
import cloud_image from "../../assets/cloud-bg.jpg";

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [loading, setLoading] = useState(false);

  const chatParent = useRef<HTMLUListElement>(null);
  const [chatStarted, setChatStarted] = useState(false);

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      domNode.scrollTop = domNode.scrollHeight;
    }
  }, [messages]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chatStarted) setChatStarted(true);
    setLoading(true);
    await handleSubmit(e);
    setLoading(false);
  };

  return (
    <div
      // style={{
      //   backgroundImage:
      //     "radial-gradient(circle, rgba(26, 26, 26, 0.8) 0%, rgba(0, 0, 0, 0.8) 100%), url(" +
      //     cloud_image.src +
      //     ")",
      //   backgroundSize: "cover",
      //   backgroundPosition: "center",
      //   backgroundRepeat: "no-repeat",
      // }}
      className="flex flex-col bg-fixed min-h-screen bg-[#bababa]"
    >
      <main className="flex flex-col w-full">
        <header className="p-4 w-full max-w-3xl text-center mx-auto">
          <h1 className="w-full text-accent text-base font-light italic">
            AI Chat
          </h1>
        </header>

        <section
          className={clsx(
            "transition-all duration-500 ease-in-out flex flex-col items-center justify-center w-full h-full border-accent border-opacity-10",
            chatStarted ? "hidden" : "flex"
          )}
        >
          <p className="text-lg mb-2">
            Welcome to DYPCET Colleges AI Assistant. Type something and press
            Enter to start.✧
          </p>
          <form
            onSubmit={handleFormSubmit}
            className="flex justify-center gap-2 items-center w-[50%] h-24 rounded-lg"
          >
            <Input
              className="h-full w-full bg-transparent text-[#a1a1a1] text-lg"
              placeholder="Ask anything..."
              type="text"
              value={input}
              onChange={handleInputChange}
            />
            <Button className="ml-2" type="submit" disabled={loading}>
              {loading ? "Loading..." : "Submit"}
            </Button>
          </form>
          {/* <div
            style={{
              backgroundImage:
                "radial-gradient(50% 100% at 50% 100%, #262626 0%, #141414 100%)",
              borderColor: "rgb(159 159 173 / var(--tw-bg-opacity))",
            }}
            className="w-[98%] h-[60%] m-10 rounded-3xl border border-accent border-opacity-10"
          ></div> */}
        </section>

        <section
          className={clsx(
            "container  h-screen px-0 py-10 flex flex-col flex-grow gap-4 mx-auto max-w-3xl transition-all duration-500 ease-in-out",
            chatStarted ? "opacity-100 translate-y-0" : "opacity-0"
          )}
        >
          <ul
            ref={chatParent}
            className="h-1 p-4 flex-grow rounded-lg overflow-y-auto flex flex-col gap-4 bg-[#212121] bg-opacity-25 border-gray-500 border-[1px] border-opacity-25"
          >
            {messages.map((m, index) => (
              <li
                key={index}
                className={clsx(
                  "flex",
                  m.role === "user" ? "flex-row" : "flex-row-reverse"
                )}
              >
                <div className="rounded-xl p-4 bg-background shadow-md flex w-3/4">
                  <p className="text-primary">
                    {m.role === "user" ? (
                      m.content
                    ) : (
                      <>
                        <span className="font-bold">Answer: </span>
                        {m.content}
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {loading && (
            <div className="flex justify-center items-center mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500"></div>
              <span className="ml-2 text-[#a1a1a1]">
                Generating response...
              </span>
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            className="flex w-full max-w-3xl rounded-lg mx-auto items-center mt-4"
          >
            <Input
              className="flex-1 min-h-[40px]"
              placeholder="Type your question here..."
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={loading}
            />
            <Button className="ml-2" type="submit" disabled={loading}>
              {loading ? "Loading..." : "Submit"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
