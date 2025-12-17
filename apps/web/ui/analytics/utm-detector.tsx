import UTM from "./utm";

// Simplified UTM detector - removed redundant API calls
// Previously made 3 detection calls (utm_sources, utm_mediums, utm_campaigns)
// Now just renders UTM component which makes 1 call (top_links) to get actual data
export default function UTMDetector({
  dragHandleProps,
}: {
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  // UTM component handles its own data fetching and empty state
  return <UTM dragHandleProps={dragHandleProps} />;
}
