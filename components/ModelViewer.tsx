"use client";

import Image from "next/image";
import { Ma_Shan_Zheng } from "next/font/google";
import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SiteModelSummary } from "@/lib/site-models";
import type {
  Material,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Texture,
  WebGLRenderer,
} from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

type ViewerState =
  | { kind: "loading"; message: string }
  | { kind: "ready"; message: string }
  | { kind: "error"; message: string };

type ModelViewerProps = {
  models: SiteModelSummary[];
};

type OverviewStageProps = {
  models: SiteModelSummary[];
  onSelect: (slug: string) => void;
};

type SingleModelStageProps = {
  model: SiteModelSummary;
  onBack: () => void;
};

type OverviewMapFrameProps = {
  children?: ReactNode;
};

type MapLabelProps = {
  model: SiteModelSummary;
  onSelect: (slug: string) => void;
};

const FALLBACK_MAP_POSITION = { x: 0.5, y: 0.93 };
const LOCATION_IMAGE_WIDTH = 2038;
const LOCATION_IMAGE_HEIGHT = 1280;
const LOCATION_IMAGE_RATIO = LOCATION_IMAGE_WIDTH / LOCATION_IMAGE_HEIGHT;
const LABEL_DOT_OFFSET = 33;
const mapLabelFont = Ma_Shan_Zheng({
  weight: "400",
  display: "swap",
  preload: false,
  fallback: ["STKaiti", "Kaiti SC", "KaiTi", "Songti SC", "serif"],
});
const MAP_LABEL_TEXT_STYLE: CSSProperties = {
  WebkitTextStroke: "4px rgba(247, 242, 232, 0.96)",
  paintOrder: "stroke fill",
  textShadow:
    "0 2px 8px rgba(255, 248, 236, 0.88), 0 8px 18px rgba(42, 28, 16, 0.16)",
};
const PAPER_PANEL_CLASS =
  "border border-[#65513f]/10 bg-[linear-gradient(180deg,_rgba(255,255,252,0.95)_0%,_rgba(247,243,236,0.98)_100%)] shadow-[0_24px_56px_rgba(72,51,32,0.16)]";
const PAPER_BUTTON_CLASS =
  "border border-[#4d3b2d]/10 bg-[linear-gradient(180deg,_rgba(255,255,253,0.96)_0%,_rgba(247,243,236,0.98)_100%)] text-[#2f2118] shadow-[0_14px_28px_rgba(73,52,34,0.12)]";

function createMistTextureCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const gradient = context.createRadialGradient(128, 128, 14, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.96)");
  gradient.addColorStop(0.24, "rgba(248, 252, 246, 0.62)");
  gradient.addColorStop(0.52, "rgba(226, 237, 225, 0.2)");
  gradient.addColorStop(1, "rgba(226, 237, 225, 0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}

function disposeMaterial(material: Material) {
  material.dispose();
}

function disposeObject(object: Object3D) {
  object.traverse((child: Object3D) => {
    if (!("isMesh" in child) || !child.isMesh) {
      return;
    }

    const mesh = child as Mesh;
    mesh.geometry.dispose();

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(disposeMaterial);
      return;
    }

    if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
}

function OverviewMapFrame({ children }: OverviewMapFrameProps) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: `max(100vw, calc(100vh * ${LOCATION_IMAGE_RATIO}))`,
          height: `max(100vh, calc(100vw / ${LOCATION_IMAGE_RATIO}))`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="relative h-full w-full">
          <Image
            src="/api/layout-image"
            alt="园林建筑位置总览"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="select-none object-cover"
          />

          {children ? <div className="absolute inset-0 z-10">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

function MapLabel({ model, onSelect }: MapLabelProps) {
  const mapPosition = model.mapPosition ?? FALLBACK_MAP_POSITION;

  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${mapPosition.x * 100}%`,
        top: `${mapPosition.y * 100}%`,
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(model.slug)}
        className="group relative border-0 bg-transparent p-0"
        aria-label={`查看 ${model.label} 模型`}
        title={`查看 ${model.label}`}
      >
        <span className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-14 w-[calc(100%+2rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/0 blur-2xl transition duration-200 group-hover:bg-[rgba(255,248,236,0.72)] group-focus-visible:bg-[rgba(255,248,236,0.72)]" />
        <span
          className="pointer-events-none absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/80 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.78),0_0_10px_rgba(255,255,255,0.62)] transition duration-200 group-hover:scale-125 group-hover:shadow-[0_0_0_1.5px_rgba(0,0,0,0.86),0_0_18px_rgba(255,255,255,0.84)] group-focus-visible:scale-125 group-focus-visible:shadow-[0_0_0_1.5px_rgba(0,0,0,0.86),0_0_18px_rgba(255,255,255,0.84)]"
          style={{ top: `calc(50% + ${LABEL_DOT_OFFSET}px)` }}
        />
        <span
          className={`${mapLabelFont.className} relative block whitespace-nowrap text-[clamp(1.7rem,2vw,2.5rem)] leading-none tracking-[0.02em] text-[#18110d] transition duration-200 group-hover:scale-[1.03] group-hover:text-[#3a2010] group-focus-visible:scale-[1.03] group-focus-visible:text-[#3a2010]`}
          style={MAP_LABEL_TEXT_STYLE}
        >
          {model.label}
        </span>
      </button>
    </div>
  );
}

function OverviewStage({ models, onSelect }: OverviewStageProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelect = (slug: string) => {
    setIsDrawerOpen(false);
    onSelect(slug);
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      <OverviewMapFrame>
        {models.map((model) => (
          <MapLabel key={model.slug} model={model} onSelect={handleSelect} />
        ))}
      </OverviewMapFrame>

      <div
        className={`absolute inset-0 z-20 bg-[rgba(250,248,244,0.16)] backdrop-blur-[6px] transition ${
          isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="absolute right-4 top-4 z-30 flex max-h-[calc(100vh-2rem)] flex-col items-end gap-3 sm:right-6 sm:top-6 sm:max-h-[calc(100vh-3rem)]">
        <button
          type="button"
          onClick={() => setIsDrawerOpen((value) => !value)}
          aria-expanded={isDrawerOpen}
          aria-label="打开建筑目录"
          className={`${PAPER_PANEL_CLASS} group relative inline-flex items-center gap-2 overflow-hidden rounded-[1rem] px-3.5 py-2 backdrop-blur-md transition hover:border-[#4e3b2c]/18 hover:bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(250,246,240,1)_100%)]`}
        >
          <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-[rgba(255,255,255,0.96)]" />
          <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-[rgba(171,145,114,0.2)]" />
          <span
            className={`${mapLabelFont.className} relative text-[1.05rem] leading-none tracking-[0.04em] text-[#2f2118]`}
          >
            目录
          </span>
          <span className="rounded-full border border-[#4d3b2d]/10 bg-[rgba(255,255,255,0.92)] px-2 py-0.5 text-[10px] leading-none tracking-[0.16em] text-[#5c4a3a]">
            {models.length}
          </span>
        </button>

        <aside
          className={`${PAPER_PANEL_CLASS} relative flex w-[min(82vw,332px)] flex-col gap-4 overflow-hidden rounded-[1.5rem] p-5 backdrop-blur-xl transition duration-200 sm:p-6 ${
            isDrawerOpen
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,_rgba(255,255,255,0.72)_0%,_transparent_34%),linear-gradient(180deg,_rgba(134,108,76,0.03)_0%,_rgba(255,255,255,0)_100%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#7b6450]/72">
                园林图录
              </p>
              <h2
                className={`${mapLabelFont.className} mt-3 text-[1.6rem] leading-none tracking-[0.03em] text-[#2f2118]`}
              >
                循图入景
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="relative shrink-0 whitespace-nowrap rounded-full border border-[#4d3b2d]/10 bg-[rgba(255,255,255,0.84)] px-3 py-1.5 text-xs text-[#5a4839] transition hover:border-[#4d3b2d]/20 hover:bg-[rgba(255,255,255,0.98)]"
            >
              收起
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[1.1rem] border border-[#6b5645]/8 bg-[rgba(255,255,255,0.68)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="max-h-[calc(100vh-13rem)] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
              {models.length > 0 ? (
                models.map((model, index) => (
                  <button
                    key={model.slug}
                    type="button"
                    onClick={() => handleSelect(model.slug)}
                    className="group flex w-full items-start gap-3 border-t border-[#8f7150]/8 px-4 py-3 text-left transition first:border-t-0 hover:bg-[rgba(250,245,238,0.92)]"
                  >
                    <span className="mt-1 shrink-0 text-[10px] leading-none tracking-[0.28em] text-[#a18364]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`${mapLabelFont.className} text-[1.28rem] leading-none tracking-[0.03em] text-[#241913] transition group-hover:text-[#3a2a1d]`}
                        >
                          {model.label}
                        </p>
                        <span className="mt-1 shrink-0 text-[11px] text-[#8c7156]">
                          入景
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-5 text-[#5e4b3a]">
                        {model.summary}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-sm leading-6 text-[#7c5131]">
                  图录中暂未发现可进入的 `.glb` 建筑模型。
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function SingleModelStage({ model, onBack }: SingleModelStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>({
    kind: "loading",
    message: `正在加载 ${model.label}…`,
  });

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let isDisposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let renderer: WebGLRenderer | null = null;
    let loadedScene: Object3D | null = null;
    let baseMistTexture: Texture | null = null;
    let baseMistMaterials: Material[] = [];
    let baseMistSprites: Object3D[] = [];
    let camera: PerspectiveCamera | null = null;
    let controls: OrbitControls | null = null;

    setViewerState({
      kind: "loading",
      message: `正在加载 ${model.label}…`,
    });

    const syncRendererSize = () => {
      if (!renderer || !camera) {
        return;
      }

      const { clientWidth, clientHeight } = container;

      if (!clientWidth || !clientHeight) {
        return;
      }

      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    const mountViewer = async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js"
        );
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js"
        );

        if (isDisposed) {
          return;
        }

        const scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(38, 1, 0.1, 5000);
        camera.position.set(3.5, 2.4, 6.8);

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.setClearAlpha(0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        renderer.domElement.style.touchAction = "none";

        container.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.minPolarAngle = 0.08;
        controls.maxPolarAngle = Math.PI / 2.16;
        controls.rotateSpeed = 0.82;
        controls.zoomSpeed = 0.92;
        controls.target.set(0, 1.1, 0);

        const ambientLight = new THREE.AmbientLight(0xfbfff8, 1.2);
        const hemiLight = new THREE.HemisphereLight(0xf4fbef, 0xa7b4a1, 2.2);
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
        const fillLight = new THREE.DirectionalLight(0xd6ead7, 1.35);
        const rimLight = new THREE.DirectionalLight(0xf8f0de, 0.92);

        keyLight.position.set(7, 10, 9);
        fillLight.position.set(-6, 4, 7);
        rimLight.position.set(3, 4, -8);

        scene.add(ambientLight, hemiLight, keyLight, fillLight, rimLight);

        syncRendererSize();

        resizeObserver = new ResizeObserver(() => {
          syncRendererSize();
        });
        resizeObserver.observe(container);

        const loader = new GLTFLoader();

        loader.load(
          `/api/model?slug=${encodeURIComponent(model.slug)}`,
          (gltf: GLTF) => {
            if (isDisposed || !camera || !controls) {
              return;
            }

            loadedScene = gltf.scene || gltf.scenes[0];

            if (!loadedScene) {
              setViewerState({
                kind: "error",
                message: "模型文件为空，无法展示。",
              });
              return;
            }

            scene.add(loadedScene);

            const box = new THREE.Box3().setFromObject(loadedScene);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const sphere = box.getBoundingSphere(new THREE.Sphere());
            const radius = Math.max(sphere.radius, 1);
            const bottomY = box.min.y - center.y;

            loadedScene.position.set(-center.x, -center.y, -center.z);

            const mistCanvas = createMistTextureCanvas();

            if (mistCanvas) {
              baseMistTexture = new THREE.CanvasTexture(mistCanvas);
              baseMistTexture.colorSpace = THREE.SRGBColorSpace;

              const lowerMistMaterial = new THREE.SpriteMaterial({
                map: baseMistTexture,
                color: 0xf1f6ee,
                opacity: 0.18,
                transparent: true,
                depthWrite: false,
              });
              const lowerMist = new THREE.Sprite(lowerMistMaterial);
              lowerMist.position.set(0, bottomY + radius * 0.08, radius * 0.04);
              lowerMist.scale.set(radius * 1.8, radius * 0.52, 1);
              lowerMist.renderOrder = 1;

              baseMistMaterials = [lowerMistMaterial];
              baseMistSprites = [lowerMist];
              scene.add(lowerMist);
            }

            const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
            const fitHeightDistance = radius / Math.tan(halfFov);
            const fitWidthDistance =
              fitHeightDistance / Math.max(camera.aspect, 0.1);
            const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.18;

            camera.near = Math.max(distance / 120, 0.1);
            camera.far = Math.max(distance * 35, 100);
            camera.position.set(
              radius * 0.38,
              Math.max(size.y * 0.16, radius * 0.28),
              distance
            );
            camera.updateProjectionMatrix();

            controls.target.set(0, 0, 0);
            controls.minDistance = Math.max(radius * 0.85, 1.2);
            controls.maxDistance = Math.max(radius * 5.5, 14);
            controls.update();

            setViewerState({
              kind: "ready",
              message: `正在查看 ${model.label}。拖拽可旋转，滚轮可缩放。`,
            });
          },
          (event: ProgressEvent<EventTarget>) => {
            if (isDisposed) {
              return;
            }

            if (event.total > 0) {
              const progress = Math.min(
                100,
                Math.round((event.loaded / event.total) * 100)
              );

              setViewerState({
                kind: "loading",
                message: `正在加载 ${model.label}… ${progress}%`,
              });
              return;
            }

            setViewerState({
              kind: "loading",
              message: `正在加载 ${model.label}…`,
            });
          },
          () => {
            if (isDisposed) {
              return;
            }

            setViewerState({
              kind: "error",
              message: `模型加载失败，请确认 ${model.label} 的模型文件可正常读取。`,
            });
          }
        );

        renderer.setAnimationLoop(() => {
          controls?.update();
          renderer?.render(scene, camera!);
        });
      } catch {
        if (isDisposed) {
          return;
        }

        setViewerState({
          kind: "error",
          message: "Three.js 初始化失败，请检查浏览器 WebGL 支持。",
        });
      }
    };

    mountViewer();

    return () => {
      isDisposed = true;
      resizeObserver?.disconnect();
      controls?.dispose();

      if (renderer) {
        renderer.setAnimationLoop(null);
      }

      if (loadedScene) {
        disposeObject(loadedScene);
      }

      baseMistSprites.forEach((sprite) => {
        sprite.parent?.remove(sprite);
      });
      baseMistMaterials.forEach((material) => {
        material.dispose();
      });
      baseMistTexture?.dispose();
      renderer?.dispose();

      if (renderer?.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [model.label, model.slug]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_#c8d0c1_0%,_#b1bca8_42%,_#87977c_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,_rgba(255,224,159,0.38)_0%,_rgba(255,224,159,0.12)_26%,_transparent_44%),radial-gradient(circle_at_82%_18%,_rgba(135,161,120,0.28)_0%,_transparent_24%),radial-gradient(circle_at_54%_86%,_rgba(213,224,203,0.18)_0%,_transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,245,214,0.18)_0%,_rgba(255,245,214,0.08)_20%,_rgba(255,255,255,0)_42%,_rgba(56,74,55,0.14)_100%)]" />
      <div className="pointer-events-none absolute left-[-10%] top-[6%] h-[38%] w-[42%] rounded-full bg-[radial-gradient(circle,_rgba(255,232,180,0.62)_0%,_rgba(255,232,180,0.16)_48%,_transparent_78%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] top-[18%] h-[36%] w-[34%] rounded-full bg-[radial-gradient(circle,_rgba(176,201,162,0.34)_0%,_rgba(176,201,162,0.12)_50%,_transparent_78%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-[10%] bottom-[-14%] h-[42%] rounded-full bg-[radial-gradient(circle,_rgba(208,219,200,0.24)_0%,_rgba(208,219,200,0.1)_36%,_transparent_74%)] blur-3xl" />

      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      <div className="absolute left-4 right-4 top-4 flex flex-col gap-4 sm:left-6 sm:right-6 sm:top-6">
        <div className="flex flex-col gap-3 sm:max-w-[18rem]">
          <button
            type="button"
            onClick={onBack}
            aria-label="返回总览"
            className={`${PAPER_BUTTON_CLASS} w-fit rounded-full px-3 py-1.5 text-sm font-medium backdrop-blur-md transition hover:border-[#4d3b2d]/20 hover:bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(250,246,240,1)_100%)]`}
          >
            返回
          </button>

          <div
            className={`${PAPER_PANEL_CLASS} pointer-events-none rounded-[1.5rem] px-3.5 py-3 backdrop-blur-xl sm:px-4 sm:py-3.5`}
          >
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-[#7b6450]/72">
              园林光景
            </p>
            <h2 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-[#2f2118] sm:text-[1.85rem]">
              {model.label}
            </h2>
            <p className="mt-2 max-w-[16rem] text-sm leading-6 text-[#5e4b3a]">
              {model.summary}
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 sm:bottom-6">
        <div
          className={`max-w-xl rounded-full border px-4 py-2 text-center text-sm backdrop-blur-md ${
            viewerState.kind === "error"
              ? "border-rose-300/45 bg-rose-100/80 text-rose-900"
              : "border-white/16 bg-[#1b281e]/40 text-slate-100"
          }`}
        >
          {viewerState.message}
        </div>
      </div>
    </section>
  );
}

export default function ModelViewer({ models }: ModelViewerProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selectedModel =
    models.find((model) => model.slug === selectedSlug) ?? null;

  if (selectedModel) {
    return (
      <SingleModelStage
        model={selectedModel}
        onBack={() => setSelectedSlug(null)}
      />
    );
  }

  return <OverviewStage models={models} onSelect={setSelectedSlug} />;
}
