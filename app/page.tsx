import ModelViewer from "@/components/ModelViewer";
import { getAvailableSiteModels } from "@/lib/site-models";

export default async function Home() {
  const models = await getAvailableSiteModels();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,_#c8d0c1_0%,_#b1bca8_42%,_#87977c_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,_rgba(255,224,159,0.38)_0%,_rgba(255,224,159,0.12)_26%,_transparent_44%),radial-gradient(circle_at_82%_18%,_rgba(135,161,120,0.28)_0%,_transparent_24%),radial-gradient(circle_at_54%_86%,_rgba(213,224,203,0.18)_0%,_transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,245,214,0.18)_0%,_rgba(255,245,214,0.08)_20%,_rgba(255,255,255,0)_42%,_rgba(56,74,55,0.14)_100%)]" />
      <ModelViewer models={models} />
    </main>
  );
}
