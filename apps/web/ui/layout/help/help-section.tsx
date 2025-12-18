"use client";

import { useResizeObserver } from "@dub/ui";
import { motion } from "framer-motion";
import { useRef, useState, type RefObject } from "react";
import { ContactForm } from "./contact-form";
import { HelpArticles } from "./help-articles";

export function HelpSection() {
  const [screen, setScreen] = useState<"main" | "contact">("contact");

  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverEntry = useResizeObserver(
    containerRef as unknown as RefObject<Element>,
  );

  return (
    <motion.div
      className="w-full overflow-y-scroll sm:w-[32rem]"
      animate={{
        height: resizeObserverEntry?.borderBoxSize[0].blockSize ?? "auto",
        maxHeight: "calc(100vh - 10rem)",
      }}
      transition={{ type: "spring", duration: 0.3 }}
    >
      <div ref={containerRef}>
        {screen === "main" && <HelpArticles setScreen={setScreen} />}
        {screen === "contact" && <ContactForm setScreen={setScreen} />}
      </div>
    </motion.div>
  );
}
