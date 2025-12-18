import { cn } from "@dub/utils";
import { SVGProps, useEffect, useRef } from "react";

type HoverableSvgProps = { "data-hovered"?: boolean } & SVGProps<SVGSVGElement>;

// Icons in this file are kept as local components so we can control sizing/hover behavior.

function useHoverWiggle(
  hovered: boolean | undefined,
  ref: React.RefObject<SVGSVGElement | null>,
) {
  useEffect(() => {
    if (!hovered || !ref.current) return;
    ref.current.animate(
      [
        { transform: "translate(0, 0)" },
        { transform: "translate(0.5px, -0.5px)" },
        { transform: "translate(-0.5px, 0.5px)" },
        { transform: "translate(0, 0)" },
      ],
      { duration: 260 },
    );
  }, [hovered, ref]);
}

function useHoverSpin(
  hovered: boolean | undefined,
  ref: React.RefObject<SVGSVGElement | null>,
) {
  useEffect(() => {
    if (!hovered || !ref.current) return;
    ref.current.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(180deg)" }], {
      duration: 320,
    });
  }, [hovered, ref]);
}

export function PimmsLinksIcon({ className, ...rest }: HoverableSvgProps) {
  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="36"
        d="M208 352h-64a96 96 0 0 1 0-192h64m96 0h64a96 96 0 0 1 0 192h-64m-140.71-96h187.42"
      />
    </svg>
  );
}

export function PimmsTodayIcon({ className, ...rest }: HoverableSvgProps) {
  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        fill="currentColor"
        d="M17.0839 15.812C19.6827 13.0691 19.6379 8.73845 16.9497 6.05025C14.2161 3.31658 9.78392 3.31658 7.05025 6.05025C4.36205 8.73845 4.31734 13.0691 6.91612 15.812C7.97763 14.1228 9.8577 13 12 13C14.1423 13 16.0224 14.1228 17.0839 15.812ZM8.38535 17.2848L12 20.8995L15.6147 17.2848C14.9725 15.9339 13.5953 15 12 15C10.4047 15 9.0275 15.9339 8.38535 17.2848ZM12 23.7279L5.63604 17.364C2.12132 13.8492 2.12132 8.15076 5.63604 4.63604C9.15076 1.12132 14.8492 1.12132 18.364 4.63604C21.8787 8.15076 21.8787 13.8492 18.364 17.364L12 23.7279ZM12 10C12.5523 10 13 9.55228 13 9C13 8.44772 12.5523 8 12 8C11.4477 8 11 8.44772 11 9C11 9.55228 11.4477 10 12 10ZM12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9C15 10.6569 13.6569 12 12 12Z"
      />
    </svg>
  );
}

export function PimmsAnalyticsIcon({ className, ...rest }: HoverableSvgProps) {
  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        fill="currentColor"
        d="M456 128a40 40 0 0 0-37.23 54.6l-84.17 84.17a39.86 39.86 0 0 0-29.2 0l-60.17-60.17a40 40 0 1 0-74.46 0L70.6 306.77a40 40 0 1 0 22.63 22.63L193.4 229.23a39.86 39.86 0 0 0 29.2 0l60.17 60.17a40 40 0 1 0 74.46 0l84.17-84.17A40 40 0 1 0 456 128z"
      />
    </svg>
  );
}

export function PimmsFlameIcon({ className, ...rest }: HoverableSvgProps) {
  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        d="M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235"
      />
    </svg>
  );
}

export function PimmsReportIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        fill="currentColor"
        d="M2 3.75C2 2.784 2.784 2 3.75 2h16.5c.966 0 1.75.784 1.75 1.75v16.5A1.75 1.75 0 0 1 20.25 22H3.75A1.75 1.75 0 0 1 2 20.25ZM9 9v11.5h11.25a.25.25 0 0 0 .25-.25V9Zm11.5-1.5V3.75a.25.25 0 0 0-.25-.25H9v4ZM3.5 9v11.25c0 .138.112.25.25.25H7.5V9Zm4-1.5v-4H3.75a.25.25 0 0 0-.25.25V7.5Z"
      />
    </svg>
  );
}

export function PimmsUtmParamsIcon({ className, ...rest }: HoverableSvgProps) {
  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <line x1="4" x2="20" y1="9" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="4" x2="20" y1="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" x2="8" y1="3" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" x2="14" y1="3" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PimmsTemplatesIcon({ className, ...rest }: HoverableSvgProps) {
  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 17 17"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        fill="currentColor"
        d="M0 10h5v-3h-5v3zM1 8h3v1h-3v-1zM6 10h5v-3h-5v3zM7 8h3v1h-3v-1zM12 7v3h5v-3h-5zM16 9h-3v-1h3v1z"
      />
    </svg>
  );
}

export function PimmsAffiliateIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);

  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9a3 3 0 1 0 -3 -3" />
        <path d="M15 6a3 3 0 1 0 -3 3" />
        <path d="M12 15a3 3 0 1 0 -3 -3" />
        <path d="M15 12a3 3 0 1 0 -3 3" />
        <path d="M12 3v3" />
        <path d="M12 9v3" />
        <path d="M12 15v3" />
      </g>
    </svg>
  );
}

export function PimmsSettingsIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverSpin(hovered, ref);
  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8a4 4 0 1 0 4 4a4 4 0 0 0 -4 -4z" />
        <path d="M3 12h1.5" />
        <path d="M19.5 12h1.5" />
        <path d="M12 3v1.5" />
        <path d="M12 19.5v1.5" />
        <path d="M5.636 5.636l1.061 1.061" />
        <path d="M17.303 17.303l1.061 1.061" />
        <path d="M5.636 18.364l1.061 -1.061" />
        <path d="M17.303 6.697l1.061 -1.061" />
      </g>
    </svg>
  );
}

export function PimmsShieldIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);
  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 4v5a7 7 0 0 1 -14 0v-5z" />
        <path d="M9 12l2 2l4 -4" />
      </g>
    </svg>
  );
}

export function PimmsGiftIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);

  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13" />
        <path d="M12 8a3 3 0 1 0 -3 -3" />
        <path d="M12 8a3 3 0 1 1 3 -3" />
        <path d="M3 12v9a1 1 0 0 0 1 1h7" />
        <path d="M21 12v9a1 1 0 0 1 -1 1h-7" />
      </g>
    </svg>
  );
}

export function PimmsGlobeIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!hovered || !ref.current) return;
    ref.current.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(12deg)" }, { transform: "rotate(0deg)" }], {
      duration: 260,
    });
  }, [hovered]);

  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("[transform-origin:center] overflow-visible", className)}
      {...rest}
    >
      <path fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="32" d="M256 48C141.13 48 48 141.13 48 256s93.13 208 208 208 208-93.13 208-208S370.87 48 256 48z" />
      <path fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="32" d="M256 48c-58.07 0-112.67 93.13-112.67 208S197.93 464 256 464s112.67-93.13 112.67-208S314.07 48 256 48z" />
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32" d="M117.33 117.33c38.24 27.15 86.38 43.34 138.67 43.34s100.43-16.19 138.67-43.34m0 277.34c-38.24-27.15-86.38-43.34-138.67-43.34s-100.43 16.19-138.67 43.34" />
      <path fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="32" d="M256 48v416m208-208H48" />
    </svg>
  );
}

export function PimmsUsersIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);

  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 8a4 4 0 1 1 8 0a4 4 0 1 1 -8 0" />
        <path d="M5.5 21h11a2.5 2.5 0 0 0 2.5 -2.5v-1a5.5 5.5 0 0 0 -11 0v1a2.5 2.5 0 0 0 2.5 2.5" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-1a5.5 5.5 0 0 0 -3 -4.9" />
      </g>
    </svg>
  );
}

export function PimmsCardIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);
  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18" />
        <path d="M7 15h.01" />
        <path d="M11 15h2" />
      </g>
    </svg>
  );
}

export function PimmsPlugIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);
  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2v6" />
        <path d="M15 2v6" />
        <path d="M12 17v5" />
        <path d="M5 8h14" />
        <path d="M7 8v4a5 5 0 0 0 10 0v-4" />
      </g>
    </svg>
  );
}

export function PimmsKeyIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);
  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 10a4 4 0 1 0 -8 0a4 4 0 0 0 8 0z" />
        <path d="M10 10l-7 7l4 0l0 4l4 0l0 -4l4 0l0 -4" />
        <path d="M10 10l4 4" />
      </g>
    </svg>
  );
}

export function PimmsWebhookIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!hovered || !ref.current) return;
    ref.current.animate([{ transform: "translateX(0)" }, { transform: "translateX(1px)" }, { transform: "translateX(0)" }], {
      duration: 220,
    });
  }, [hovered]);

  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible", className)}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.5 13a3.5 3.5 0 1 0 -3.5 -3.5" />
        <path d="M5.417 7.573a3.5 3.5 0 1 0 4.58 4.83" />
        <path d="M12.096 13.5a3.5 3.5 0 1 0 4.58 4.83" />
        <path d="M16 10.5v-6h3" />
        <path d="M12.096 13.5h5.804l2.5 4" />
        <path d="M6 8v-5h3.5" />
        <path d="M5.417 7.573l-2.917 5.027l2.5 4.33" />
      </g>
    </svg>
  );
}

export function PimmsGridIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);

  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="5" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="19" cy="5" r="1" />
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="19" r="1" />
        <circle cx="12" cy="19" r="1" />
        <circle cx="19" cy="19" r="1" />
      </g>
    </svg>
  );
}

export function PimmsStoreIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);

  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21v-14l-2 -4h18l-2 4v14" />
        <path d="M9 21v-6a3 3 0 0 1 6 0v6" />
        <path d="M3 7h18" />
      </g>
    </svg>
  );
}

export function PimmsGaugeIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const needleRef = useRef<SVGLineElement>(null);
  useEffect(() => {
    if (!hovered || !needleRef.current) return;
    needleRef.current.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(-18deg)" }, { transform: "rotate(0deg)" }],
      { duration: 260 },
    );
  }, [hovered]);

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("[&_line]:[transform-origin:12px_12px] [&_line]:[transform-box:fill-box]", className)}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 14v-4" />
        <path d="M10 12h4" />
        <path d="M5.636 18.364a9 9 0 1 1 12.728 0" />
        <line ref={needleRef} x1="12" y1="12" x2="12" y2="8" />
      </g>
    </svg>
  );
}

export function PimmsMoneyIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);

  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="9" width="14" height="10" rx="2" />
        <circle cx="14" cy="14" r="2" />
        <path d="M17 14h3" />
        <path d="M7 14h3" />
        <path d="M10 6l-3 3l3 3" />
        <path d="M3 6v12" />
      </g>
    </svg>
  );
}

export function PimmsUserIcon({ "data-hovered": hovered, className, ...rest }: HoverableSvgProps) {
  const ref = useRef<SVGSVGElement>(null);
  useHoverWiggle(hovered, ref);
  return (
    <svg
      ref={ref}
      height="18"
      width="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4" />
        <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
      </g>
    </svg>
  );
}

