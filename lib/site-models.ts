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
  verse: string;
  interpretation: string;
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
    verse: "一楼收远岫，半窗贮春云。",
    interpretation:
      "拙政园中部最高建筑，名字取自陶渊明“采菊东篱下，悠然见南山”，是全园登高望远的核心节点。楼为两层木结构，临池而建，登楼可俯瞰全园山水，将远处北寺塔借景入园，完美实现“远借”的造园手法，承载着文人“归隐田园、寄情山水”的理想。",
    mapPosition: { x: 0.478, y: 0.333 },
    mapSize: { width: 0.068, height: 0.06 },
  },
  {
    slug: "xuexiangyunweiting",
    label: "雪香云蔚亭",
    summary: "北岸岛屿上的亭景节点。",
    verse: "雪意浮疏影，香风过小亭。",
    interpretation:
      "雪香云蔚亭位于拙政园中部假山之巅，与远香堂隔水相对，是全园视觉中心。“雪香”喻寒梅清韵，“云蔚”绘山林盛景，登亭可俯瞰全园水景，尽览江南园林“咫尺山林”的造园精髓，是文人寄情山水的经典载体。",
    mapPosition: { x: 0.6068, y: 0.3984 },
    mapSize: { width: 0.09, height: 0.06 },
  },
  {
    slug: "hefengsimianting",
    label: "荷风四面亭",
    summary: "连接主水面的临水亭。",
    verse: "四面荷风起，波心一亭轻。",
    interpretation:
      "拙政园中部水景核心，四面临水、四面皆窗，因夏日荷风穿亭、香气四溢得名。亭内悬“荷风四面亭”匾额，两侧楹联“四壁荷花三面柳，半潭秋水一房山”，精准点出园林“借景、框景”的造园精髓，是观赏全园水景与四季风光的绝佳节点，尽显江南园林“移步换景”的营造智慧。",
    mapPosition: { x: 0.5423, y: 0.5004 },
    mapSize: { width: 0.072, height: 0.042 },
  },
  {
    slug: "xiangzhou",
    label: "香洲",
    summary: "水心区域的重要建筑节点。",
    verse: "水国藏芳渚，轻烟抱晚汀。",
    interpretation:
      "拙政园标志性石舫（旱船），由文徵明设计，名字取自《楚辞・九歌・湘君》“采芳洲兮杜若”，是江南园林石舫的巅峰之作。建筑下石上木、三面环水，形似画舫静泊水面，象征文人“不仕、隐逸、高洁”的精神追求，完美契合拙政园“文人造园”的核心意境。",
    mapPosition: { x: 0.4898, y: 0.6266 },
    mapSize: { width: 0.052, height: 0.04 },
  },
  {
    slug: "xiaofeihong",
    label: "小飞虹",
    summary: "连接水岸与岛屿的跨水桥景。",
    verse: "一痕飞虹落，倒影卧清波。",
    interpretation:
      "拙政园唯一的廊桥，名字取自《兰亭集序》“飞虹跨水”，是连接南北园区的重要节点。桥为木结构、朱红栏杆，横跨水面，既是交通枢纽，也是绝佳的观景与框景节点：站在桥上，可将香洲、荷风四面亭、见山楼等核心景观串联成画，是江南园林“廊桥造景”的经典范例。",
    mapPosition: { x: 0.5515, y: 0.7352 },
    mapSize: { width: 0.05, height: 0.036 },
  },
  {
    slug: "yuanxiangtang",
    label: "远香堂",
    summary: "东南侧的主体厅堂建筑。",
    verse: "远香来水际，清气满闲堂。",
    interpretation:
      "拙政园中部主体建筑，名字取自周敦颐《爱莲说》“香远益清”，是全园的核心厅堂。堂内无一根立柱，四面落地长窗，可将四周山水、亭台、荷池尽收眼底，是典型的“四面厅”形制，既体现了中式建筑的营造技艺，也承载了文人“以莲自喻、高洁自持”的文化内涵。",
    mapPosition: { x: 0.6624, y: 0.6261 },
    mapSize: { width: 0.064, height: 0.042 },
  },
  {
    slug: "yulantang",
    label: "玉兰堂",
    summary: "西南侧院落中的厅堂空间。",
    verse: "玉兰开静院，月白满前阶。",
    interpretation:
      "拙政园南部庭院核心建筑，因院内种植白玉兰得名，是典型的江南文人庭院。建筑为硬山顶，粉墙黛瓦，庭院布局精巧，以玉兰、假山、水池营造清幽意境，是明代文人书房式庭院的代表，承载着文人“以花喻人、清雅脱俗”的审美追求。",
    mapPosition: { x: 0.4058, y: 0.7141 },
    mapSize: { width: 0.064, height: 0.042 },
  },
  {
    slug: "linglongguan",
    label: "玲珑馆",
    summary: "东侧园林带中的小馆建筑。",
    verse: "窗含千树影，馆纳一庭风。",
    interpretation:
      "拙政园南部庭院核心建筑，名字取自“玲珑剔透”，因馆内陈设精巧、庭院布局玲珑得名。建筑为硬山顶，粉墙黛瓦，院内种植芭蕉、竹子，营造“雨打芭蕉、竹影婆娑”的清幽意境，是明代文人书房式庭院的代表，承载着文人“清雅、精致”的生活追求。",
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
    verse: "尚待题咏，留与后来人。",
    interpretation: "此处模型尚未补入对应解说。",
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
    verse: record?.verse ?? "尚待题咏，留与后来人。",
    interpretation: record?.interpretation ?? "此处模型尚未补入对应解说。",
    mapPosition: record?.mapPosition ?? { x: 0.5, y: 0.93 },
    mapSize: record?.mapSize ?? DEFAULT_MAP_SIZE,
    fileName: toFileName(slug),
    filePath,
  };
}
