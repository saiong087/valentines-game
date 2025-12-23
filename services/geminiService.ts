import { GoogleGenAI, Type } from "@google/genai";
import { LevelData, HiddenObject } from "../types";

interface BackupConfig {
  base64: string;
  theme: string;
  story: string;
  hiddenObjects: HiddenObject[];
}

const FALLBACK_IMAGES = [
  '/backup1.jpg',
  '/backup2.jpg',
  '/backup3.jpg',
  '/backup4.jpg',
];

// Hardcoded metadata for the local backup levels.
// Use 'Dev Mode' in the app to find the correct coordinates (ymin, xmin, ymax, xmax) for these items!
const BACKUP_LEVEL_CONFIGS: { [key: number]: BackupConfig } = {
  0: { // backup1.jpg
    base64: "", theme: "ด่านที่ 1: สวนแห่งความลับ", story: "ในสวนแห่งนี้มีของวิเศษซ่อนอยู่ 4 อย่าง ลองหาดูสิ",
    hiddenObjects: [
      { id: 'b1_1', name: 'ดอกกุหลาบ / Rose', hint: 'ราชินีแห่งดอกไม้', box: { ymin: 280, xmin: 429, ymax: 467, xmax: 725 } },
      { id: 'b1_2', name: 'ช็อกโกแลต / Chocolate', hint: 'ของหวานยอดนิยม', box: { ymin: 698, xmin: 769, ymax: 762, xmax: 849 } },
      { id: 'b1_3', name: 'การ์ด / Card', hint: 'ส่งความในใจ', box: { ymin: 732, xmin: 138, ymax: 921, xmax: 489 } },
      { id: 'b1_4', name: 'ตุ๊กตาหมี / Teddy Bear', hint: 'เพื่อนขนนุ่ม', box: { ymin: 317, xmin: 30, ymax: 757, xmax: 491 } },
    ]
  },
  1: { // backup2.jpg
    base64: "", theme: "ด่านที่ 2: ห้องนั่งเล่นแสนสุข", story: "มีของเล่นหายไป 4 ชิ้น ช่วยตามหาหน่อยนะ",
    hiddenObjects: [
      { id: 'b2_1', name: 'นก / Bird', hint: 'สัตว์ปีกตัวน้อย', box: { ymin: 234, xmin: 198, ymax: 308, xmax: 291 } },
      { id: 'b2_2', name: 'ไม้กางเขน / Cross', hint: 'สัญลักษณ์รูปกากบาท', box: { ymin: 388, xmin: 738, ymax: 452, xmax: 794 } },
      { id: 'b2_3', name: 'กระโปรง / Skirt', hint: 'เครื่องแต่งกาย', box: { ymin: 585, xmin: 329, ymax: 885, xmax: 589 } },
      { id: 'b2_4', name: 'ผู้ชาย / Man', hint: 'บุคคลในภาพ', box: { ymin: 334, xmin: 144, ymax: 563, xmax: 319 } },
    ]
  },
  2: { // backup3.jpg
    base64: "", theme: "ด่านที่ 3: ปาร์ตี้วันเกิด", story: "ขนมและของขวัญกระจายไปทั่วงาน ช่วยเก็บหน่อย",
    hiddenObjects: [
      { id: 'b3_1', name: 'พระจันทร์ / Moon', hint: 'ส่องสว่างบนฟ้า', box: { ymin: 40, xmin: 496, ymax: 176, xmax: 667 } },
      { id: 'b3_2', name: 'คัมภีร์ / Scroll', hint: 'บันทึกโบราณ', box: { ymin: 657, xmin: 33, ymax: 729, xmax: 210 } },
      { id: 'b3_3', name: 'ต้นไม้ / Tree', hint: 'ให้ร่มเงา', box: { ymin: 409, xmin: 598, ymax: 551, xmax: 687 } },
      { id: 'b3_4', name: 'ลูกศร / Arrow', hint: 'อาวุธ', box: { ymin: 213, xmin: 202, ymax: 306, xmax: 312 } },
    ]
  },
  3: { // backup4.jpg
    base64: "", theme: "ด่านที่ 4: ชายหาดหรรษา", story: "ของเล่นชายหาดหายไปไหนหมดนะ?",
    hiddenObjects: [
      { id: 'b4_1', name: 'สุนัข / Dog', hint: 'เพื่อนซี้สี่ขา', box: { ymin: 446, xmin: 489, ymax: 572, xmax: 642 } },
      { id: 'b4_2', name: 'นาฬิกา / Clock', hint: 'บอกเวลา', box: { ymin: 23, xmin: 446, ymax: 102, xmax: 550 } },
      { id: 'b4_3', name: 'ของขวัญ / Gift', hint: 'กล่องปริศนา', box: { ymin: 648, xmin: 630, ymax: 735, xmax: 724 } },
      { id: 'b4_4', name: 'เครื่องเขียน / Stationery', hint: 'อุปกรณ์การเรียน', box: { ymin: 262, xmin: 54, ymax: 332, xmax: 109 } },
    ]
  }
};

export const BACKUP_LEVELS: BackupConfig[] = FALLBACK_IMAGES.map((path, index) => {
  const config = BACKUP_LEVEL_CONFIGS[index] || { theme: `ด่านที่ ${index + 1}`, story: "...", hiddenObjects: [] };
  return {
    base64: "",
    theme: config.theme,
    story: config.story,
    hiddenObjects: config.hiddenObjects
  };
});

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,") to match existing format
      const base64Content = base64String.split(',')[1] || base64String;
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateFallbackLevel = async (index?: number): Promise<LevelData> => {
  const targetIndex = index !== undefined
    ? index % FALLBACK_IMAGES.length
    : Math.floor(Math.random() * FALLBACK_IMAGES.length);

  const imagePath = FALLBACK_IMAGES[targetIndex];

  try {
    const response = await fetch(imagePath);
    if (!response.ok) throw new Error(`Failed to load ${imagePath}`);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    return {
      theme: `ด่านที่ ${targetIndex + 1}`,
      story: "ภาพปริศนาจากคลังภาพของคุณเอง ลองระบายสีและเติมจินตนาการลงไปซิ!",
      hiddenObjects: [],
      imageMode: 'RASTER',
      rasterImage: base64,
      isLocal: true,
      localIndex: targetIndex
    };
  } catch (error) {
    console.error("Error loading fallback image:", error);
    // Fallback to error message if loading fails
    throw new Error(`ไม่สามารถโหลดไฟล์รูปภาพ ${imagePath} ได้`);
  }
};

export const generateValentineLevel = async (): Promise<LevelData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return await generateFallbackLevel();

  const ai = new GoogleGenAI({ apiKey });
  const imagePrompt = `A cute Valentine's Day coloring page for kids, black and white line art, white background, thick bold lines, simple characters, no shading. Subjects: Hearts, Cupids, and Roses.`;
  let base64Image: string | undefined;

  try {
    const imageResp = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: imagePrompt }] }],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    const part = imageResp.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) base64Image = part.inlineData.data;
  } catch (e) {
    console.warn("AI Image Generation failed, falling back to local level.", e);
    return await generateFallbackLevel();
  }

  if (!base64Image) return await generateFallbackLevel();

  const analysisPrompt = `Analyze this coloring page. List 4 distinct objects visible in the line art. Output ONLY JSON with theme, story (a short Thai myth about Valentine), and hiddenObjects array (id, name, hint in Thai, and box: {ymin, xmin, ymax, xmax} 0-1000 scale).`;

  try {
    const analysisResp = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Image } },
            { text: analysisPrompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            story: { type: Type.STRING },
            hiddenObjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  box: {
                    type: Type.OBJECT,
                    properties: {
                      ymin: { type: Type.NUMBER },
                      xmin: { type: Type.NUMBER },
                      ymax: { type: Type.NUMBER },
                      xmax: { type: Type.NUMBER },
                    },
                    required: ['ymin', 'xmin', 'ymax', 'xmax']
                  }
                },
                required: ['id', 'name', 'hint', 'box']
              }
            }
          },
          required: ['theme', 'story', 'hiddenObjects']
        }
      },
    });

    const result = JSON.parse(analysisResp.text || '{}');
    return {
      theme: result.theme || "วันแห่งความรัก",
      story: result.story || "ตำนานรักนิรันดร์",
      hiddenObjects: result.hiddenObjects || [],
      imageMode: 'RASTER',
      rasterImage: base64Image,
      isLocal: false
    };
  } catch (e) {
    console.warn("AI Analysis failed, falling back to local level.", e);
    return await generateFallbackLevel();
  }
};