import { constants } from "node:fs";
import { access, readdir } from "node:fs/promises";
import path from "node:path";

type MapPosition = {
  x: number;
  y: number;
};

type MapSize = {
  width: number;
  height: number;
};

type SiteModelRecord = {
  slug: string;
  label: string;
  summary: string;
  mapPosition: MapPosition;
  mapSize: MapSize;
};

export type SiteModelSummary = SiteModelRecord & {
  fileName: string;
};

export type SiteModelAsset = SiteModelSummary & {
  filePath: string;
};

const GLB_DIRECTORY = path.join(process.cwd(), "glbfile");
const LOCATION_IMAGE_PATH = path.join(GLB_DIRECTORY, "location.png");
const SAFE_SLUG_PATTERN = /^[a-z0-9-]+$/;

const SITE_MODEL_CATALOG: readonly SiteModelRecord[] = [
  {
    slug: "jianshanlou",
    label: "见山楼",
    summary: "位于主水面北侧的核心楼阁。",
    mapPosition: { x: 0.478, y: 0.333 },
    mapSize: { width: 0.068, height: 0.06 },
  },
  {
    slug: "xuexiangyunweiting",
    label: "雪香云蔚亭",
    summary: "北岸岛屿上的亭景节点。",
    mapPosition: { x: 0.6068, y: 0.3984 },
    mapSize: { width: 0.09, height: 0.06 },
  },
  {
    slug: "hefengsimianting",
    label: "荷风四面亭",
    summary: "连接主水面的临水亭。",
    mapPosition: { x: 0.5423, y: 0.5004 },
    mapSize: { width: 0.072, height: 0.042 },
  },
  {
    slug: "xiangzhou",
    label: "香洲",
    summary: "水心区域的重要建筑节点。",
    mapPosition: { x: 0.4898, y: 0.6266 },
    mapSize: { width: 0.052, height: 0.04 },
  },
  {
    slug: "xiaofeihong",
    label: "小飞虹",
    summary: "连接水岸与岛屿的跨水桥景。",
    mapPosition: { x: 0.5515, y: 0.7352 },
    mapSize: { width: 0.05, height: 0.036 },
  },
  {
    slug: "yuanxiangtang",
    label: "远香堂",
    summary: "东南侧的主体厅堂建筑。",
    mapPosition: { x: 0.6624, y: 0.6261 },
    mapSize: { width: 0.064, height: 0.042 },
  },
  {
    slug: "yulantang",
    label: "玉兰堂",
    summary: "西南侧院落中的厅堂空间。",
    mapPosition: { x: 0.4058, y: 0.7141 },
    mapSize: { width: 0.064, height: 0.042 },
  },
  {
    slug: "linglongguan",
    label: "玲珑馆",
    summary: "东侧园林带中的小馆建筑。",
    mapPosition: { x: 0.807, y: 0.7078 },
    mapSize: { width: 0.056, height: 0.05 },
  },
] as const;

const catalogBySlug = new Map(
  SITE_MODEL_CATALOG.map((record) => [record.slug, record] as const)
);

const DEFAULT_MAP_SIZE: MapSize = {
  width: 0.06,
  height: 0.04,
};

function toFileName(slug: string) {
  return `${slug}.glb`;
}

function toFallbackLabel(slug: string) {
  return slug
    .split("-")
    .map((segment) => segment.slice(0, 1).toUpperCase() + segment.slice(1))
    .join(" ");
}

function toFallbackPosition(index: number, total: number): MapPosition {
  return {
    x: (index + 1) / (total + 1),
    y: 0.93,
  };
}

export function getLocationImagePath() {
  return LOCATION_IMAGE_PATH;
}

export async function getAvailableSiteModels(): Promise<SiteModelSummary[]> {
  const entries = await readdir(GLB_DIRECTORY, { withFileTypes: true }).catch(
    () => []
  );
  const discoveredSlugs = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".glb"))
    .map((entry) => entry.name.slice(0, -4));
  const discoveredSlugSet = new Set(discoveredSlugs);

  const knownModels = SITE_MODEL_CATALOG.filter((record) =>
    discoveredSlugSet.has(record.slug)
  ).map((record) => ({
    ...record,
    fileName: toFileName(record.slug),
  }));

  const unknownSlugs = discoveredSlugs
    .filter((slug) => !catalogBySlug.has(slug))
    .sort((left, right) => left.localeCompare(right));

  const unknownModels = unknownSlugs.map((slug, index) => ({
    slug,
    label: toFallbackLabel(slug),
    summary: "已发现模型文件，但尚未配置园区里的精确位置。",
    mapPosition: toFallbackPosition(index, unknownSlugs.length),
    mapSize: DEFAULT_MAP_SIZE,
    fileName: toFileName(slug),
  }));

  return [...knownModels, ...unknownModels];
}

export async function getSiteModelAsset(
  slug: string
): Promise<SiteModelAsset | null> {
  if (!SAFE_SLUG_PATTERN.test(slug)) {
    return null;
  }

  const filePath = path.join(GLB_DIRECTORY, toFileName(slug));

  try {
    await access(filePath, constants.R_OK);
  } catch {
    return null;
  }

  const record = catalogBySlug.get(slug);

  return {
    slug,
    label: record?.label ?? toFallbackLabel(slug),
    summary: record?.summary ?? "根据文件名识别出的单体模型。",
    mapPosition: record?.mapPosition ?? { x: 0.5, y: 0.93 },
    mapSize: record?.mapSize ?? DEFAULT_MAP_SIZE,
    fileName: toFileName(slug),
    filePath,
  };
}
