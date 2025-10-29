"use client";

import { Button } from "@dub/ui";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitFeedback } from "./action";

export default function Feedback() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="scrollbar-hide relative z-0 h-[400px] overflow-scroll bg-white rounded border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200 px-4 py-4">
      <div className="mb-4 flex">
        <h1 className="text-xl font-semibold">Feedback</h1>
      </div>
      <AnimatePresence>
        {submitted ? (
          <motion.div
            className="flex h-[280px] flex-col items-center justify-center space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle className="h-8 w-8 text-green-500" />
            <p className="text-gray-600">Thank you for your feedback!</p>
          </motion.div>
        ) : (
          <motion.form
            action={(data) =>
              submitFeedback(data).then(() => {
                setSubmitted(true);
              })
            }
            className="grid gap-4"
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-gray-600"
              >
                EMAIL
              </label>
              <input
                name="email"
                type="email"
                placeholder="cheers@pimms.io"
                autoComplete="email"
                className="block w-full rounded-full border border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300/50 focus:outline-none focus:ring-0 focus:ring-transparent/50 sm:text-sm px-3 py-2"
              />
            </div>
            <div>
              <label
                htmlFor="feedback"
                className="mb-2 block text-xs font-medium text-gray-600"
              >
                FEEDBACK
              </label>
              <textarea
                name="feedback"
                id="feedback"
                required={true}
                rows={6}
                className="block w-full rounded border border-gray-200/50 text-gray-900 placeholder-gray-400 focus:border-gray-300/50 focus:outline-none focus:ring-0 focus:ring-transparent/50 sm:text-sm px-3 py-2"
                placeholder="What other data would you like to see?"
                aria-invalid="true"
              />
            </div>
            <FormButton />
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

const FormButton = () => {
  const { pending } = useFormStatus();
  return <Button text="Submit feedback" loading={pending} />;
};
