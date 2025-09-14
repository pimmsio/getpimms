export function ColdScoreIcon({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg
      width="512"
      height="512"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M0 256C0 114.615 114.615 0 256 0C397.385 0 512 114.615 512 256C512 397.385 397.385 512 256 512C114.615 512 0 397.385 0 256Z"
        fill="#C0F1FF"
      />
      <path
        d="M236.885 324.506L221 95H291L272.983 324.506H236.885ZM234.307 417V369.456H275.562V417H234.307Z"
        fill="#2FCDFA"
      />
    </svg>
  );
}

export function WarmScoreIcon({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M0 256C0 114.615 114.615 0 256 0V0C397.385 0 512 114.615 512 256V256C512 397.385 397.385 512 256 512V512C114.615 512 0 397.385 0 256V256Z"
        fill="#F59F00"
      />
      <path
        d="M187.885 324.506L172 95H242L223.983 324.506H187.885ZM185.307 417V369.456H226.562V417H185.307Z"
        fill="#FFEAC1"
      />
      <path
        d="M285.885 324.506L270 95H340L321.983 324.506H285.885ZM283.307 417V369.456H324.562V417H283.307Z"
        fill="#FFEAC1"
      />
    </svg>
  );
}

export function HotScoreIcon({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M0 256C0 114.615 114.615 0 256 0V0C397.385 0 512 114.615 512 256V256C512 397.385 397.385 512 256 512V512C114.615 512 0 397.385 0 256V256Z"
        fill="#F0174A"
      />
      <path
        d="M138.885 324.506L123 95H193L174.983 324.506H138.885ZM136.307 417V369.456H177.562V417H136.307Z"
        fill="#FFCDCD"
      />
      <path
        d="M236.885 324.506L221 95H291L272.983 324.506H236.885ZM234.307 417V369.456H275.562V417H234.307Z"
        fill="#FFCDCD"
      />
      <path
        d="M334.885 324.506L319 95H389L370.983 324.506H334.885ZM332.307 417V369.456H373.562V417H332.307Z"
        fill="#FFCDCD"
      />
    </svg>
  );
}

export function getHotScoreIcon(score: number) {
  if (score <= 33) {
    return ColdScoreIcon;
  } else if (score <= 66) {
    return WarmScoreIcon;
  } else {
    return HotScoreIcon;
  }
}

export function getHotScoreLabel(score: number) {
  if (score <= 33) {
    return "Cold";
  } else if (score <= 66) {
    return "Warm";
  } else {
    return "Hot";
  }
}
