import { recordMetatags } from "@/lib/upstash";
import { fetchWithTimeout, isValidUrl } from "@dub/utils";
import { waitUntil } from "@vercel/functions";
import { parseDocument } from "htmlparser2";
import { isTag, isText } from "domutils";
import type { Node, Element } from "domhandler";

export const getHtml = async (url: string) => {
  return await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PIMMS.io/1.0; +https://api.pimms.io/metatags)",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Cache-Control": "no-cache",
    },
    redirect: "follow",
  }, 10000)
    .then((r) => r.text())
    .catch(() => null);
};

export const getHeadChildNodes = (html: string) => {
  if (!html) {
    return { metaTags: [], title: null, linkTags: [] };
  }
  
  // Use htmlparser2 - fast and reliable HTML parser
  const document = parseDocument(html);
  
  const metaTags: Array<{ property: string | undefined; content: string | undefined }> = [];
  const linkTags: Array<{ rel: string | undefined; href: string | undefined }> = [];
  let title: string | null = null;
  
  // Helper function to traverse DOM and extract elements
  const traverse = (node: Node) => {
    if (isTag(node)) {
      const element = node as Element;
      
      // Extract title
      if (element.name === 'title') {
        const textContent = element.children
          .filter(isText)
          .map(child => child.data)
          .join('')
          .trim();
        if (textContent && !title) {
          title = textContent;
        }
      }
      
      // Extract meta tags
      if (element.name === 'meta') {
        const property = element.attribs.property || element.attribs.name || element.attribs['http-equiv'];
        const content = element.attribs.content;
        metaTags.push({ property, content });
      }
      
      // Extract link tags
      if (element.name === 'link') {
        const rel = element.attribs.rel;
        const href = element.attribs.href;
        linkTags.push({ rel, href });
      }
    }
    
    // Recursively traverse children
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  };
  
  // Start traversing from the document root
  traverse(document);
  
  return { metaTags, title, linkTags };
};

export const getRelativeUrl = (url: string, imageUrl: string) => {
  if (!imageUrl) {
    return null;
  }
  if (isValidUrl(imageUrl)) {
    return imageUrl;
  }
  const { protocol, host } = new URL(url);
  const baseURL = `${protocol}//${host}`;
  return new URL(imageUrl, baseURL).toString();
};

export const getMetaTags = async (url: string) => {
  const html = await getHtml(url);
  if (!html) {
    return {
      title: url,
      description: "No description",
      image: null,
    };
  }
  const { metaTags, title: titleTag, linkTags } = getHeadChildNodes(html);

  let object = {};

  for (let k in metaTags) {
    let { property, content } = metaTags[k];

    // !object[property] → (meaning we're taking the first instance of a metatag and ignoring the rest)
    property &&
      !object[property] &&
      (object[property] = content);
  }

  for (let m in linkTags) {
    let { rel, href } = linkTags[m];

    // !object[rel] → (ditto the above)
    rel && !object[rel] && (object[rel] = href);
  }

  const title = object["og:title"] || object["twitter:title"] || titleTag;

  const description =
    object["description"] ||
    object["og:description"] ||
    object["twitter:description"];

  const image =
    object["og:image"] ||
    object["twitter:image"] ||
    object["image_src"] ||
    object["icon"] ||
    object["shortcut icon"];

  waitUntil(recordMetatags(url, title && description && image ? false : true));

  return {
    title: title || url,
    description: description || "No description",
    image: getRelativeUrl(url, image),
  };
};
