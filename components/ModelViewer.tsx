"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

const subscribeToMount = () => () => {};
const FALLBACK_MAP_POSITION = { x: 0.5, y: 0.93 };
const LOCATION_IMAGE_WIDTH = 2038;
const LOCATION_IMAGE_HEIGHT = 1280;
const LOCATION_IMAGE_RATIO = LOCATION_IMAGE_WIDTH / LOCATION_IMAGE_HEIGHT;
const MARKER_VERTICAL_OFFSET = 33 / LOCATION_IMAGE_HEIGHT;

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

function OverviewStage({ models, onSelect }: OverviewStageProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelect = (slug: string) => {
    setIsDrawerOpen(false);
    onSelect(slug);
  };

  return (
    <section className="relative min-h-screen w-full px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto mb-4 flex max-w-[1680px] items-end justify-between gap-4 px-1">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-emerald-950/65">
            园区总览
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            园林建筑模型导览
          </h1>
        </div>
      </div>

      <div className="mx-auto relative min-h-[calc(100vh-7rem)] max-w-[1680px] overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/18 shadow-2xl shadow-black/25">
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
          <div
            className={`relative overflow-hidden rounded-[1.7rem] transition-transform duration-300 ease-out ${
              isDrawerOpen
                ? "-translate-x-12 md:-translate-x-24 xl:-translate-x-36"
                : "translate-x-0"
            }`}
            style={{
              width: `min(100%, calc((100vh - 10rem) * ${LOCATION_IMAGE_RATIO}))`,
            }}
          >
            <Image
              src="/api/layout-image"
              alt="园林建筑位置总览"
              width={LOCATION_IMAGE_WIDTH}
              height={LOCATION_IMAGE_HEIGHT}
              priority
              unoptimized
              className="block h-auto w-full select-none"
            />

            <div className="absolute inset-0 z-10">
              {models.map((model) => {
                const mapPosition = model.mapPosition ?? FALLBACK_MAP_POSITION;
                const markerY = Math.min(
                  mapPosition.y + MARKER_VERTICAL_OFFSET,
                  0.98
                );

                return (
                  <button
                    key={model.slug}
                    type="button"
                    onClick={() => handleSelect(model.slug)}
                    className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-0 bg-transparent p-0 transition-transform duration-200 ${
                      isDrawerOpen ? "h-10 w-10" : "h-8 w-8"
                    }`}
                    style={{
                      left: `${mapPosition.x * 100}%`,
                      top: `${markerY * 100}%`,
                    }}
                    aria-label={`查看 ${model.label} 模型`}
                    title={`查看 ${model.label}`}
                  >
                    <span className="pointer-events-none absolute inset-0 rounded-full bg-white/0 transition group-hover:bg-white/10 group-focus-visible:bg-white/10" />
                    <span
                      className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ff7b72]/45 transition ${
                        isDrawerOpen
                          ? "h-6 w-6 opacity-100"
                          : "h-4 w-4 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                      }`}
                    />
                    <span className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/85 bg-[#ff4d46] shadow-[0_0_0_3px_rgba(255,255,255,0.18),0_4px_12px_rgba(21,29,22,0.35)] transition duration-200 group-hover:scale-110 group-focus-visible:scale-110" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen((value) => !value)}
          aria-expanded={isDrawerOpen}
          aria-label="打开建筑目录"
          className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-slate-950/72 px-3 py-1.5 text-sm font-medium text-white shadow-lg shadow-black/25 transition hover:border-emerald-200/35 hover:bg-slate-900/82 sm:right-6 sm:top-6"
        >
          <span>目录</span>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] leading-none text-slate-100">
            {models.length}
          </span>
        </button>

        <div
          className={`absolute inset-0 transition ${
            isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setIsDrawerOpen(false)}
        />

        <aside
          className={`absolute inset-y-3 right-3 z-10 flex w-[min(92vw,380px)] flex-col gap-4 rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,_rgba(7,18,17,0.92)_0%,_rgba(6,14,17,0.96)_100%)] p-5 shadow-2xl shadow-black/35 transition duration-300 sm:inset-y-4 sm:right-4 sm:p-6 ${
            isDrawerOpen
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-[calc(100%+1rem)] opacity-0"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-emerald-100/75">
                建筑目录
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                共 {models.length} 个建筑
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-100 transition hover:border-emerald-200/35 hover:bg-white/[0.08]"
            >
              收起
            </button>
          </div>

          <div className="grid gap-3 overflow-y-auto pr-1">
            {models.length > 0 ? (
              models.map((model) => (
                <button
                  key={model.slug}
                  type="button"
                  onClick={() => handleSelect(model.slug)}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:border-emerald-200/35 hover:bg-emerald-100/[0.08]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-white">
                      {model.label}
                    </p>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200">
                      进入
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {model.summary}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-rose-400/30 bg-rose-500/10 px-4 py-4 text-sm leading-6 text-rose-100">
                未在 `glbfile` 目录中发现可用的 `.glb` 文件。
              </div>
            )}
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
            className="w-fit rounded-full border border-white/16 bg-[#203126]/58 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition hover:border-amber-200/35 hover:bg-[#26382b]/76"
          >
            返回
          </button>

          <div className="pointer-events-none rounded-[1.5rem] border border-white/16 bg-[#1b281e]/38 px-3.5 py-3 shadow-[0_20px_60px_rgba(46,61,40,0.22)] backdrop-blur-xl sm:px-4 sm:py-3.5">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-amber-100/70">
              园林光景
            </p>
            <h2 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-white sm:text-[1.85rem]">
              {model.label}
            </h2>
            <p className="mt-2 max-w-[16rem] text-sm leading-6 text-slate-200">
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
  const isMounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false
  );
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selectedModel =
    models.find((model) => model.slug === selectedSlug) ?? null;

  if (!isMounted) {
    return (
      <section className="relative min-h-screen w-full px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto mb-4 flex max-w-[1680px] items-end justify-between gap-4 px-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-sky-200/75">
              园区总览
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              园林建筑模型导览
            </h1>
          </div>
        </div>

        <div className="mx-auto relative min-h-[calc(100vh-7rem)] max-w-[1680px] overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/35 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(10,18,30,0.75)_0%,_rgba(6,12,20,0.88)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_28%,_rgba(125,211,252,0.12)_0%,_transparent_22%),radial-gradient(circle_at_72%_35%,_rgba(167,243,208,0.1)_0%,_transparent_22%)]" />
        </div>
      </section>
    );
  }

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
