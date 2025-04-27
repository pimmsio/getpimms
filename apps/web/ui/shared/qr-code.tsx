import { QrCustom } from "@getpimms/qr-code-generator";
import { memo, useCallback, useEffect, useState } from "react";

export const QRCode = memo(
  ({
    scale = 1,
    url,
    fgColor,
    logo,
  }: {
    url: string;
    fgColor?: string;
    hideLogo?: boolean;
    logo?: string;
    scale?: number;
    margin?: number;
  }) => {
    const size = 160 * scale;
    const [qrBase64, setQrBase64] = useState<string | null>(null);
    const [displaySize, setDisplaySize] = useState<{
      width: number;
      height: number;
    }>({ width: size, height: size });

    const getFrame = useCallback(async () => {
      const frameUrl = "https://assets-code.pimms.io/frames/W9_euUlC96pDO72w7xqGk";
      const res = await fetch(frameUrl);
      const frame = await res.text();
      return frame;
    }, []);

    useEffect(() => {
      const generate = async () => {
        const frame = await getFrame();
    
        if (!frame) {
          return;
        }
    
        const generateQrCode = async () => {
          const qrcode = new QrCustom(url, {
            colors: fgColor ? [fgColor] : ["#000000"],
            corner: "corner1",
            level: "H",
            // logo,
            patterns: [
              {
                name: "pattern10",
                scale: 1,
              },
            ],
            type: 0,
            frame,
          });
          const base64 = await qrcode.getSvgDataUri();
          const dimensions = await qrcode.getDimensions();
    
          const aspectRatio = dimensions.width / dimensions.height;
          let width, height;
    
          if (dimensions.width > dimensions.height) {
            width = Math.min(size, dimensions.width);
            height = width / aspectRatio;
          } else {
            height = Math.min(size, dimensions.height);
            width = height * aspectRatio;
          }
    
          setDisplaySize({ width, height });
          setQrBase64(base64);
        };
    
        await generateQrCode();
      };
    
      generate();
    }, [size, getFrame, url, fgColor, logo]);
    
    return qrBase64 ? (
      <img
        src={qrBase64}
        alt="QR code"
        width={displaySize.width}
        height={displaySize.height}
        className={`h-[${displaySize.height}px] w-[${displaySize.width}px] pointer-events-none`}
        style={{ maxWidth: "100%", height: "auto" }} // Ensure it's responsive
      />
    ) : null;
  },
);

QRCode.displayName = "QRCode";
