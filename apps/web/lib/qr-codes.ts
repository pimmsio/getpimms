import {
  CornerType,
  QRPatternWithScale,
  QrCustom,
  QrCustomOptions,
} from "@getpimms/qr-code-generator";
import {
  CreateStaticQRCodesPostRequestBody,
  ImageType,
  QrCodesCustomization,
} from "@getpimms/types";
import { Transformer } from "@napi-rs/image";
import { registerWindow } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";

const defaultOptions: Omit<QrCustomOptions, "frame"> = {
  colors: ["#000000", "#000000"],
  corner: "corner1",
  level: "H",
  logo: undefined,
  patterns: [{ name: "pattern1", scale: 1 }],
  type: 0,
};

export async function generateStaticQRCode(
  reqBody: CreateStaticQRCodesPostRequestBody,
  frameSvg: string,
) {
  const options = generateQrOptions(
    reqBody.customization,
    frameSvg,
    reqBody.customization?.id,
  );
  return new QrCustom(reqBody.value, options);
}

export async function staticQRCodeImage(
  qrcode: QrCustom,
  imageType: ImageType,
) {
  const svgString = (await qrcode.render()).svg();

  // upload convert file if imageType = png or jpeg
  if (imageType !== "svg") {
    const resizeSvgString = QrCustom.resize(svgString, 3000).svg();
    const convertBuffer = await convertImage(resizeSvgString, imageType, 90);
    return convertBuffer;
  } else {
    return svgString;
  }
}

export async function convertImage(
  svgString: string | Buffer,
  imageType: ImageType,
  imageQuality?: number,
) {
  const transformer = await Transformer.fromSvg(
    svgString,
    imageType === "png" ? null : "rgb(255,255,255)",
  );
  return imageType === "png"
    ? await transformer.png()
    : await transformer.jpeg(imageQuality);
}

function generateQrOptions(
  customization: QrCodesCustomization | undefined,
  frameSvg: string,
  id?: string,
) {
  const colors = customization?.colors;
  const corner = customization?.corner as CornerType;
  const logo = customization?.logo;
  const patterns = customization?.patterns as unknown as QRPatternWithScale[];
  const whitedots = customization?.whitedots;

  const options: QrCustomOptions = {
    ...defaultOptions,
    ...(colors && { colors }),
    ...(corner && { corner }),
    frame: frameSvg,
    ...(id && { id }),
    ...(logo && { logo }),
    ...(patterns && { patterns }),
    ...(whitedots !== undefined && { whitedots }),
  };

  return options;
}

export function createWindow() {
  const window = createSVGWindow();
  const document = window.document;
  registerWindow(window, document);
}
