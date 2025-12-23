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
      { id: 'b1_1', name: 'ดอกกุหลาบ', hint: 'ราชินีแห่งดอกไม้', box: { ymin: 416, xmin: 425, ymax: 522, xmax: 547 } }, // Center ~ 469, 486
      { id: 'b1_2', name: 'ช็อกโกแลต', hint: 'ของหวานยอดนิยม', box: { ymin: 692, xmin: 706, ymax: 794, xmax: 807 } }, // Center ~ 743, 756
      { id: 'b1_3', name: 'การ์ด', hint: 'ส่งความในใจ', box: { ymin: 736, xmin: 80, ymax: 840, xmax: 182 } }, // Center ~ 786, 130
      { id: 'b1_4', name: 'ตุ๊กตาหมี', hint: 'เพื่อนขนนุ่ม', box: { ymin: 325, xmin: 68, ymax: 520, xmax: 168 } }, // Already somewhat large, expanded xmax slightly
    ]
  },
  1: { // backup2.jpg
    base64: "", theme: "ด่านที่ 2: ห้องนั่งเล่นแสนสุข", story: "มีของเล่นหายไป 4 ชิ้น ช่วยตามหาหน่อยนะ",
    hiddenObjects: [
      { id: 'b2_1', name: 'นก', hint: 'สัตว์ปีกตัวน้อย', box: { ymin: 228, xmin: 141, ymax: 328, xmax: 241 } }, // Center ~ 278, 191
      { id: 'b2_2', name: 'กางเขน', hint: 'สัญลักษณ์รูปกากบาท', box: { ymin: 397, xmin: 673, ymax: 498, xmax: 773 } }, // Center ~ 447, 723
      { id: 'b2_3', name: 'กระโปรง', hint: 'เครื่องแต่งกาย', box: { ymin: 558, xmin: 314, ymax: 659, xmax: 414 } }, // Center ~ 608, 364
      { id: 'b2_4', name: 'ผู้ชาย', hint: 'บุคคลในภาพ', box: { ymin: 294, xmin: 140, ymax: 394, xmax: 240 } }, // Center ~ 344, 190
    ]
  },
  2: { // backup3.jpg
    base64: "", theme: "ด่านที่ 3: ปาร์ตี้วันเกิด", story: "ขนมและของขวัญกระจายไปทั่วงาน ช่วยเก็บหน่อย",
    hiddenObjects: [
      { id: 'b3_1', name: 'พระจันทร์', hint: 'ส่องสว่างบนฟ้า', box: { ymin: 132, xmin: 502, ymax: 233, xmax: 603 } }, // Center ~ 182, 552
      { id: 'b3_2', name: 'คิวปิด', hint: 'กามเทพตัวน้อย', box: { ymin: 308, xmin: 409, ymax: 408, xmax: 509 } }, // Center ~ 358, 459
      { id: 'b3_3', name: 'ต้นไม้', hint: 'ให้ร่มเงา', box: { ymin: 496, xmin: 880, ymax: 596, xmax: 980 } }, // Center ~ 546, 930
      { id: 'b3_4', name: 'ลูกศร', hint: 'อาวุธของกามเทพ', box: { ymin: 254, xmin: 148, ymax: 354, xmax: 248 } }, // Center ~ 304, 198
    ]
  },
  3: { // backup4.jpg
    base64: "", theme: "ด่านที่ 4: ชายหาดหรรษา", story: "ของเล่นชายหาดหายไปไหนหมดนะ?",
    hiddenObjects: [
      { id: 'b4_1', name: 'สุนัข', hint: 'เพื่อนซี้สี่ขา', box: { ymin: 410, xmin: 432, ymax: 511, xmax: 533 } }, // Center ~ 460, 482
      { id: 'b4_2', name: 'นาฬิกา', hint: 'บอกเวลา', box: { ymin: 52, xmin: 408, ymax: 153, xmax: 508 } }, // Center ~ 102, 458
      { id: 'b4_3', name: 'ของขวัญ', hint: 'กล่องปริศนา', box: { ymin: 610, xmin: 595, ymax: 711, xmax: 696 } }, // Center ~ 660, 645
      { id: 'b4_4', name: 'เครื่องเขียน', hint: 'อุปกรณ์การเรียน', box: { ymin: 278, xmin: 4, ymax: 379, xmax: 104 } }, // Center ~ 328, 53
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