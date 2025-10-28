"use client";

import { useMediaQuery, useRouterStuff } from "@dub/ui";
import { COUNTRIES } from "@dub/utils";
import { useState } from "react";
import { 
  UnifiedAnalyticsTooltip, 
  createBaseMetrics, 
  createKeyMetrics} from "./unified-analytics-tooltip";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

interface CountryData {
  country: string;
  countryCode: string;
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
}

interface WorldMapProps {
  data: CountryData[];
  maxVisitors: number;
}

interface TooltipData {
  country: string;
  visitors: number;
  revenue: number;
  conversionRate: number;
  revenuePerVisitor: number;
  leads: number;
  sales: number;
  x: number;
  y: number;
}

// World 110m topology from Natural Earth data
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Mapping of numeric country codes (from Natural Earth) to ISO 2-letter codes
const NUMERIC_TO_ISO: Record<string, string> = {
  "840": "US", // United States
  "356": "IN", // India
  "826": "GB", // United Kingdom
  "276": "DE", // Germany
  "250": "FR", // France
  "124": "CA", // Canada
  "036": "AU", // Australia
  "076": "BR", // Brazil
  "392": "JP", // Japan
  "156": "CN", // China
  "724": "ES", // Spain
  "380": "IT", // Italy
  "528": "NL", // Netherlands
  "752": "SE", // Sweden
  "578": "NO", // Norway
  "208": "DK", // Denmark
  "246": "FI", // Finland
  "616": "PL", // Poland
  "643": "RU", // Russia
  "804": "UA", // Ukraine
  "484": "MX", // Mexico
  "032": "AR", // Argentina
  "152": "CL", // Chile
  "170": "CO", // Colombia
  "604": "PE", // Peru
  "858": "UY", // Uruguay
  "862": "VE", // Venezuela
  "218": "EC", // Ecuador
  "068": "BO", // Bolivia
  "600": "PY", // Paraguay
  "328": "GY", // Guyana
  "740": "SR", // Suriname
  "254": "GF", // French Guiana
  "710": "ZA", // South Africa
  "818": "EG", // Egypt
  "566": "NG", // Nigeria
  "404": "KE", // Kenya
  "012": "DZ", // Algeria
  "504": "MA", // Morocco
  "788": "TN", // Tunisia
  "434": "LY", // Libya
  "748": "SZ", // Eswatini
  "516": "NA", // Namibia
  "072": "BW", // Botswana
  "894": "ZM", // Zambia
  "716": "ZW", // Zimbabwe
  "454": "MW", // Malawi
  "508": "MZ", // Mozambique
  "646": "RW", // Rwanda
  "800": "UG", // Uganda
  "834": "TZ", // Tanzania
  "262": "DJ", // Djibouti
  "232": "ER", // Eritrea
  "231": "ET", // Ethiopia
  "706": "SO", // Somalia
  "174": "KM", // Comoros
  "450": "MG", // Madagascar
  "480": "MU", // Mauritius
  "690": "SC", // Seychelles
  "020": "AD", // Andorra
  "040": "AT", // Austria
  "056": "BE", // Belgium
  "100": "BG", // Bulgaria
  "191": "HR", // Croatia
  "196": "CY", // Cyprus
  "203": "CZ", // Czech Republic
  "233": "EE", // Estonia
  "348": "HU", // Hungary
  "352": "IS", // Iceland
  "372": "IE", // Ireland
  "428": "LV", // Latvia
  "438": "LI", // Liechtenstein
  "440": "LT", // Lithuania
  "442": "LU", // Luxembourg
  "470": "MT", // Malta
  "492": "MC", // Monaco
  "499": "ME", // Montenegro
  "620": "PT", // Portugal
  "642": "RO", // Romania
  "674": "SM", // San Marino
  "688": "RS", // Serbia
  "703": "SK", // Slovakia
  "705": "SI", // Slovenia
  "756": "CH", // Switzerland
  "807": "MK", // North Macedonia
  "112": "BY", // Belarus
  "498": "MD", // Moldova
  "051": "AM", // Armenia
  "031": "AZ", // Azerbaijan
  "268": "GE", // Georgia
  "398": "KZ", // Kazakhstan
  "417": "KG", // Kyrgyzstan
  "762": "TJ", // Tajikistan
  "795": "TM", // Turkmenistan
  "860": "UZ", // Uzbekistan
  "004": "AF", // Afghanistan
  "050": "BD", // Bangladesh
  "064": "BT", // Bhutan
  "096": "BN", // Brunei
  "116": "KH", // Cambodia
  "360": "ID", // Indonesia
  "364": "IR", // Iran
  "368": "IQ", // Iraq
  "376": "IL", // Israel
  "400": "JO", // Jordan
  "408": "KP", // North Korea
  "410": "KR", // South Korea
  "414": "KW", // Kuwait
  "418": "LA", // Laos
  "422": "LB", // Lebanon
  "458": "MY", // Malaysia
  "462": "MV", // Maldives
  "496": "MN", // Mongolia
  "104": "MM", // Myanmar
  "524": "NP", // Nepal
  "512": "OM", // Oman
  "586": "PK", // Pakistan
  "275": "PS", // Palestine
  "608": "PH", // Philippines
  "634": "QA", // Qatar
  "682": "SA", // Saudi Arabia
  "702": "SG", // Singapore
  "144": "LK", // Sri Lanka
  "760": "SY", // Syria
  "158": "TW", // Taiwan
  "764": "TH", // Thailand
  "626": "TL", // Timor-Leste
  "792": "TR", // Turkey
  "784": "AE", // United Arab Emirates
  "704": "VN", // Vietnam
  "887": "YE", // Yemen
  "008": "AL", // Albania
  "070": "BA", // Bosnia and Herzegovina
};

// Function to convert numeric country code to ISO 2-letter code
const getISOCode = (numericCode: string): string | undefined => {
  return NUMERIC_TO_ISO[numericCode];
};

export default function WorldMap({ data, maxVisitors }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<TooltipData | null>(null);
  const { queryParams, searchParams } = useRouterStuff();
  const { isMobile } = useMediaQuery();

  // Create a map of country codes to data for quick lookup
  const countryDataMap = new Map(
    data.map(d => [d.countryCode.toLowerCase(), d])
  );

  const getCountryColor = (countryCode: string | undefined) => {
    if (!countryCode) return "#f8fafc"; // slate-50 for no data
    
    // Convert numeric code to ISO 2-letter code
    const isoCode = getISOCode(countryCode);
    if (!isoCode) return "#f1f5f9"; // slate-100 for unmapped countries
    
    const countryData = countryDataMap.get(isoCode.toLowerCase());
    if (!countryData || countryData.clicks === 0) {
      return "#f1f5f9"; // slate-100 for no data
    }
    
    const intensity = Math.min(countryData.clicks / maxVisitors, 1);
    
    // Blue heat map based on intensity
    if (intensity >= 0.8) return "#1e3a8a"; // blue-900
    if (intensity >= 0.6) return "#1e40af"; // blue-800  
    if (intensity >= 0.4) return "#2563eb"; // blue-600
    if (intensity >= 0.2) return "#3b82f6"; // blue-500
    if (intensity >= 0.1) return "#60a5fa"; // blue-400
    if (intensity >= 0.05) return "#93c5fd"; // blue-300
    if (intensity > 0) return "#dbeafe"; // blue-100
    return "#f1f5f9"; // slate-100
  };

  const handleCountryHover = (countryCode: string | undefined, event: React.MouseEvent) => {
    if (!countryCode) return;
    
    // Convert numeric code to ISO 2-letter code
    const isoCode = getISOCode(countryCode);
    if (!isoCode) return;
    
    const countryData = countryDataMap.get(isoCode.toLowerCase());
    if (!countryData) return;

    // Get mouse position relative to the page/viewport
    const x = event.clientX;
    const y = event.clientY;

    const conversionRate = countryData.clicks > 0 ? (countryData.sales / countryData.clicks) * 100 : 0;
    const revenuePerVisitor = countryData.clicks > 0 ? countryData.saleAmount / countryData.clicks / 100 : 0;

    setHoveredCountry({
      country: COUNTRIES[countryData.countryCode] || countryData.country,
      visitors: countryData.clicks,
      revenue: countryData.saleAmount / 100, // Convert from cents to dollars
      conversionRate,
      revenuePerVisitor,
      leads: countryData.leads,
      sales: countryData.sales,
      x,
      y,
    });
  };

  const handleCountryLeave = () => {
    setHoveredCountry(null);
  };

  const handleCountryClick = (countryCode: string | undefined) => {
    if (!countryCode) return;
    
    // Convert numeric code to ISO 2-letter code
    const isoCode = getISOCode(countryCode);
    if (!isoCode) return;
    
    const countryData = countryDataMap.get(isoCode.toLowerCase());
    if (!countryData) return;

    // Check if we're already filtering by this country
    const currentCountry = searchParams.get("country");
    
    if (currentCountry === isoCode) {
      // Remove filter if clicking on the already-filtered country
      queryParams({ del: "country" });
    } else {
      // Set filter to this country
      queryParams({ set: { country: isoCode }, del: "page", scroll: false });
    }
  };

  return (
    <div className="relative w-full h-[320px] overflow-hidden">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: isMobile ? 180 : 160,
          center: [0, isMobile ? 30 : 20],
        }}
        width={1000}
        height={400}
        style={{ width: "100%", height: "100%" }}
      >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryCode = geo.id;
                const isoCode = countryCode ? getISOCode(countryCode) : null;
                const countryData = isoCode ? countryDataMap.get(isoCode.toLowerCase()) : null;
                

                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryColor(countryCode)}
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: "none",
                        transition: "all 0.3s ease-in-out",
                      },
                      hover: {
                        outline: "none",
                        fill: countryData ? "#1d4ed8" : getCountryColor(countryCode),
                        cursor: countryData ? "pointer" : "default",
                        transition: "all 0.3s ease-in-out"
                      },
                      pressed: {
                        outline: "none",
                        fill: countryData ? "#1e3a8a" : getCountryColor(countryCode)
                      },
                    }}
                    onMouseEnter={(event) => {
                      if (countryData && countryCode) {
                        handleCountryHover(countryCode, event);
                      }
                    }}
                    onMouseLeave={handleCountryLeave}
                    onClick={() => {
                      if (countryData && countryCode) {
                        handleCountryClick(countryCode);
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
      </ComposableMap>

      {/* Unified Tooltip */}
      {hoveredCountry && (
        <UnifiedAnalyticsTooltip 
          sections={[
            { type: "header", title: hoveredCountry.country },
            createBaseMetrics({
              clicks: hoveredCountry.visitors,
              leads: hoveredCountry.leads,
              sales: hoveredCountry.sales,
              saleAmount: hoveredCountry.revenue * 100,
            }),
            createKeyMetrics({
              clicks: hoveredCountry.visitors,
              leads: hoveredCountry.leads,
              sales: hoveredCountry.sales,
              saleAmount: hoveredCountry.revenue * 100,
            }),
          ]}
          position={{ x: hoveredCountry.x, y: hoveredCountry.y }}
        />
      )}

    </div>
  );
}