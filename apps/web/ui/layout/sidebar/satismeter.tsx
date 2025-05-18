"use client";

import { useEffect } from "react";

type SatisMeterProps = {
  userId: string;
  name?: string;
  email?: string;
  createdAt?: string;
};

const SATISMETER_SCRIPT_ID = "satismeter-script";
const SATISMETER_SRC = "https://app.satismeter.com/js";

function initSatisMeterStub() {
  if (!window.satismeter) {
    window.satismeter = function () {
      (window.satismeter!.q = window.satismeter!.q || []).push(arguments);
    };
  }
}

function injectScript(onLoad: () => void) {
  const script = document.createElement("script");
  script.id = SATISMETER_SCRIPT_ID;
  script.src = SATISMETER_SRC;
  script.async = true;
  script.onload = onLoad;
  document.body.appendChild(script);
}

function callSatisMeter({
  userId,
  name,
  email,
  createdAt,
}: SatisMeterProps) {
  window.satismeter?.({
    writeKey: process.env.NEXT_PUBLIC_SATISMETER_WRITE_KEY as string,
    userId,
    traits: {
      ...(name && { name }),
      ...(email && { email }),
      ...(createdAt && { createdAt }),
    },
  });
}

export default function SatisMeter(props: SatisMeterProps) {
  const { userId } = props;

  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;
    if (!process.env.NEXT_PUBLIC_SATISMETER_WRITE_KEY) return;

    initSatisMeterStub();

    const scriptAlreadyExists = document.getElementById(SATISMETER_SCRIPT_ID);

    if (scriptAlreadyExists) {
      callSatisMeter(props);
    } else {
      injectScript(() => callSatisMeter(props));
    }
  }, [userId, props.name, props.email, props.createdAt]);

  return null;
}
