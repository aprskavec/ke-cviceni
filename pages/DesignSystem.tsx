import { useState, useEffect } from "react";
import {
  ArrowLeft, Check, X, Star, Trophy, Sparkles, BookOpen,
  Video, MessageCircleQuestion, Clock, Hash, ChevronDown,
  Volume2, Flag, Languages, LayoutGrid, Layers, Bookmark, User,
  Lock, Play, Flame, Snowflake, Sun, Moon
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Tab = "tokens" | "atoms" | "molecules" | "organisms";

const tabs: { id: Tab; label: string }[] = [
  { id: "tokens", label: "Design Tokens" },
  { id: "atoms", label: "Atoms" },
  { id: "molecules", label: "Molecules" },
  { id: "organisms", label: "Organisms" },
];

const DesignSystem = () => {
  const [active, setActive] = useState<Tab>("tokens");
  const [dark, setDark] = useState(() => !document.documentElement.classList.contains("light"));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    return () => {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    };
  }, [dark]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-black font-champ">Design System</h1>
          <button
            onClick={() => setDark(d => !d)}
            className="ml-auto w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="bg-card border border-border rounded-2xl p-1.5 flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-200",
                active === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 pb-16 space-y-12">
        {active === "tokens" && <TokensSection />}
        {active === "atoms" && <AtomsSection />}
        {active === "molecules" && <MoleculesSection />}
        {active === "organisms" && <OrganismsSection />}
      </div>

      {/* Route tag */}
      <div className="fixed bottom-4 right-4 text-xs text-muted-foreground font-mono opacity-40">
        /design-system
      </div>
    </div>
  );
};

/* ─── TOKENS ─────────────────────────────────────── */

const SwatchHex = ({ name, hex }: { name: string; hex: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-14 h-14 rounded-xl border border-border shadow-sm" style={{ background: hex }} />
    <p className="text-xs font-medium text-foreground leading-tight text-center">{name}</p>
    <code className="text-[10px] text-muted-foreground">{hex}</code>
  </div>
);

const GradientSwatch = ({ name, colors }: { name: string; colors: string[] }) => (
  <div className="flex flex-col items-center gap-2">
    <div
      className="w-full h-14 rounded-xl border border-border shadow-sm"
      style={{ background: `linear-gradient(135deg, ${colors.join(", ")})` }}
    />
    <p className="text-xs font-medium text-foreground">{name}</p>
    <code className="text-[10px] text-muted-foreground">{colors.join(" → ")}</code>
  </div>
);

const TypoSample = ({ label, font, size, lineHeight, weight, letterSpacing, sample = "Učíme se anglicky" }: {
  label: string; font: string; size: number; lineHeight: number; weight: number; letterSpacing: number; sample?: string;
}) => (
  <div className="flex items-baseline gap-4 py-3 border-b border-border/50 last:border-0">
    <code className="text-[10px] text-muted-foreground w-40 shrink-0 font-mono">{label}</code>
    <p
      style={{ fontFamily: font, fontSize: `${size}px`, lineHeight: `${lineHeight}px`, fontWeight: weight, letterSpacing: `${letterSpacing}px` }}
      className="text-foreground"
    >
      {sample}
    </p>
    <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">{size}/{lineHeight} · {weight}</span>
  </div>
);

const TokensSection = () => (
  <div className="space-y-12">
    {/* ── BASE COLORS ── */}
    <Section title="Base Colors">
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-4 p-6 rounded-xl bg-card border border-border">
        <SwatchHex name="Black" hex="#09090B" />
        <SwatchHex name="Grey" hex="#71717A" />
        <SwatchHex name="White" hex="#FAFAFA" />
        <SwatchHex name="Red" hex="#FF0018" />
        <SwatchHex name="Pink" hex="#FF01AA" />
        <SwatchHex name="Green" hex="#D0FF01" />
        <SwatchHex name="DarkGreen" hex="#6DD900" />
        <SwatchHex name="Blue" hex="#02BBFF" />
        <SwatchHex name="Purple" hex="#9E49FF" />
        <SwatchHex name="Yellow" hex="#FFDC00" />
      </div>
    </Section>

    {/* ── NEUTRAL SCALE ── */}
    <Section title="Neutral (0–1000)">
      <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-14 gap-3 p-6 rounded-xl bg-card border border-border">
        {[
          { n: "0", hex: "#FFFFFF" }, { n: "50", hex: "#FAFAFA" }, { n: "100", hex: "#F4F4F5" },
          { n: "150", hex: "#EEEEF1" }, { n: "200", hex: "#E4E4E7" }, { n: "300", hex: "#D4D4D8" },
          { n: "400", hex: "#A1A1AA" }, { n: "500", hex: "#71717A" }, { n: "600", hex: "#52525B" },
          { n: "700", hex: "#3F3F46" }, { n: "800", hex: "#27272A" }, { n: "900", hex: "#18181B" },
          { n: "950", hex: "#09090B" }, { n: "1000", hex: "#000000" },
        ].map((c) => (
          <SwatchHex key={c.n} name={c.n} hex={c.hex} />
        ))}
      </div>
    </Section>

    {/* ── BRAND COLORS (placeholder) ── */}
    <Section title="Brand Colors">
      <div className="p-6 rounded-xl bg-card border border-border border-dashed">
        <p className="text-sm text-muted-foreground italic">⏳ Čeká na specifikaci: Primary500, Primary600, Primary, Secondary, Tertiary + PrimaryGradient, SecondaryGradient, TertiaryGradient</p>
      </div>
    </Section>

    {/* ── GRADIENTS ── */}
    <Section title="Gradients">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GradientSwatch name="Flame" colors={["#FF1356", "#FF1356", "#FF4502"]} />
        <GradientSwatch name="Red" colors={["#FF0055", "#FF0018"]} />
        <GradientSwatch name="Purple" colors={["#9C27B0", "#AB47BC"]} />
        <GradientSwatch name="Blue" colors={["#01C9FF", "#34FFF6"]} />
        <GradientSwatch name="Green" colors={["#14FF3B", "#FFFB00"]} />
      </div>
    </Section>

    {/* ── OVERLAYS / LIGHTEN / DARKER ── */}
    <Section title="Overlays · Lighten · Darker">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl bg-card border border-border">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overlays</p>
          {[
            { name: "Black 40%", bg: "rgba(0,0,0,0.4)" }, { name: "Black 60%", bg: "rgba(0,0,0,0.6)" },
            { name: "White 40%", bg: "rgba(255,255,255,0.4)" }, { name: "White 60%", bg: "rgba(255,255,255,0.6)" },
          ].map((o) => (
            <div key={o.name} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-border overflow-hidden" style={{ backgroundImage: "linear-gradient(45deg, #888 25%, #ccc 25%, #ccc 75%, #888 75%)", backgroundSize: "8px 8px" }}>
                <div className="w-full h-full" style={{ background: o.bg }} />
              </div>
              <span className="text-xs text-muted-foreground">{o.name}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lighten (on dark)</p>
          {[
            { name: "20%", a: 0.08 }, { name: "40%", a: 0.16 }, { name: "60%", a: 0.6 }, { name: "80%", a: 0.8 },
          ].map((o) => (
            <div key={o.name} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-border overflow-hidden" style={{ background: "#18181B" }}>
                <div className="w-full h-full" style={{ background: `rgba(255,255,255,${o.a})` }} />
              </div>
              <span className="text-xs text-muted-foreground">Lighten {o.name}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Darker (on light)</p>
          {[
            { name: "5%", a: 0.02 }, { name: "20%", a: 0.08 }, { name: "40%", a: 0.16 }, { name: "60%", a: 0.6 }, { name: "80%", a: 0.8 },
          ].map((o) => (
            <div key={o.name} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-border overflow-hidden" style={{ background: "#FAFAFA" }}>
                <div className="w-full h-full" style={{ background: `rgba(0,0,0,${o.a})` }} />
              </div>
              <span className="text-xs text-muted-foreground">Darker {o.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>

    {/* ═══════════════ TYPOGRAPHY ═══════════════ */}

    {/* ── DISPLAY (Champ) ── */}
    <Section title="Display · Champ">
      <div className="p-6 rounded-xl bg-card border border-border space-y-0">
        <TypoSample label="display.bold9XL" font="Champ" size={68} lineHeight={60} weight={700} letterSpacing={-0.2} />
        <TypoSample label="display.black9XL" font="Champ" size={68} lineHeight={60} weight={900} letterSpacing={-0.2} />
        <TypoSample label="display.bold8XL" font="Champ" size={56} lineHeight={56} weight={700} letterSpacing={-0.2} />
        <TypoSample label="display.black8XL" font="Champ" size={56} lineHeight={56} weight={900} letterSpacing={-0.2} />
        <TypoSample label="display.bold7XL" font="Champ" size={48} lineHeight={48} weight={700} letterSpacing={-0.2} />
        <TypoSample label="display.bold6XL" font="Champ" size={40} lineHeight={40} weight={700} letterSpacing={-0.2} />
        <TypoSample label="display.bold5XL" font="Champ" size={28} lineHeight={32} weight={700} letterSpacing={-0.2} />
        <TypoSample label="display.black5XL" font="Champ" size={28} lineHeight={32} weight={900} letterSpacing={-0.2} />
      </div>
    </Section>

    {/* ── HEADLINE (Inter Display / Inter Tight) ── */}
    <Section title="Headline · Inter Display">
      <div className="p-6 rounded-xl bg-card border border-border space-y-0">
        <TypoSample label="headline.semibold6XL" font="Inter Tight" size={40} lineHeight={40} weight={600} letterSpacing={-0.4} />
        <TypoSample label="headline.extraBold5XL" font="Inter Tight" size={32} lineHeight={38} weight={800} letterSpacing={-0.4} />
        <TypoSample label="headline.semibold4XL" font="Inter Tight" size={28} lineHeight={36} weight={600} letterSpacing={-0.4} />
        <TypoSample label="headline.semibold3XL" font="Inter Tight" size={24} lineHeight={32} weight={600} letterSpacing={-0.4} />
        <TypoSample label="headline.semibold2XL" font="Inter Tight" size={20} lineHeight={24} weight={600} letterSpacing={-0.4} />
        <TypoSample label="headline.semiboldXL" font="Inter Tight" size={17} lineHeight={24} weight={600} letterSpacing={-0.4} />
      </div>
    </Section>

    {/* ── OVERLINE (Champ) ── */}
    <Section title="Overline · Champ">
      <div className="p-6 rounded-xl bg-card border border-border space-y-0">
        <TypoSample label="overline.medium6XL" font="Champ" size={40} lineHeight={44} weight={500} letterSpacing={1.6} sample="OVERLINE TEXT" />
        <TypoSample label="overline.medium4XL" font="Champ" size={28} lineHeight={32} weight={500} letterSpacing={1.6} sample="OVERLINE TEXT" />
        <TypoSample label="overline.medium2XL" font="Champ" size={20} lineHeight={32} weight={500} letterSpacing={1.6} sample="OVERLINE TEXT" />
        <TypoSample label="overline.mediumXL" font="Champ" size={17} lineHeight={20} weight={500} letterSpacing={1.6} sample="OVERLINE TEXT" />
        <TypoSample label="overline.mediumSM" font="Champ" size={13} lineHeight={16} weight={500} letterSpacing={2} sample="OVERLINE TEXT" />
        <TypoSample label="overline.mediumXS" font="Champ" size={12} lineHeight={16} weight={500} letterSpacing={2} sample="OVERLINE TEXT" />
        <TypoSample label="overline.medium2XS" font="Champ" size={11} lineHeight={16} weight={500} letterSpacing={2} sample="OVERLINE TEXT" />
        <TypoSample label="overline.medium3XS" font="Champ" size={9} lineHeight={12} weight={500} letterSpacing={1.5} sample="OVERLINE TEXT" />
      </div>
    </Section>

    {/* ── PARAGRAPH (Inter) ── */}
    <Section title="Paragraph · Inter">
      <div className="p-6 rounded-xl bg-card border border-border space-y-0">
        <TypoSample label="paragraph.regular2XL" font="Inter" size={20} lineHeight={28} weight={400} letterSpacing={0} />
        <TypoSample label="paragraph.medium2XL" font="Inter" size={20} lineHeight={28} weight={500} letterSpacing={0} />
        <TypoSample label="paragraph.regularXL" font="Inter" size={18} lineHeight={28} weight={400} letterSpacing={0} />
        <TypoSample label="paragraph.mediumXL" font="Inter" size={18} lineHeight={28} weight={500} letterSpacing={0} />
        <TypoSample label="paragraph.regularLG" font="Inter" size={17} lineHeight={24} weight={400} letterSpacing={0} />
        <TypoSample label="paragraph.mediumLG" font="Inter" size={17} lineHeight={24} weight={500} letterSpacing={0} />
        <TypoSample label="paragraph.regularMD" font="Inter" size={15} lineHeight={20} weight={400} letterSpacing={0} />
        <TypoSample label="paragraph.mediumMD" font="Inter" size={15} lineHeight={20} weight={500} letterSpacing={0} />
        <TypoSample label="paragraph.regularSM" font="Inter" size={13} lineHeight={20} weight={400} letterSpacing={0} />
        <TypoSample label="paragraph.mediumSM" font="Inter" size={13} lineHeight={20} weight={500} letterSpacing={0} />
        <TypoSample label="paragraph.regularXS" font="Inter" size={11} lineHeight={16} weight={400} letterSpacing={0} />
      </div>
    </Section>

    {/* ── LABEL (Inter) ── */}
    <Section title="Label · Inter">
      <div className="p-6 rounded-xl bg-card border border-border space-y-0">
        <TypoSample label="label.semiboldLG" font="Inter" size={17} lineHeight={16} weight={600} letterSpacing={0} />
        <TypoSample label="label.mediumLG" font="Inter" size={17} lineHeight={16} weight={500} letterSpacing={0} />
        <TypoSample label="label.semiboldMD" font="Inter" size={15} lineHeight={16} weight={600} letterSpacing={0} />
        <TypoSample label="label.mediumMD" font="Inter" size={15} lineHeight={16} weight={500} letterSpacing={0} />
        <TypoSample label="label.semiboldSM" font="Inter" size={13} lineHeight={12} weight={600} letterSpacing={0} />
        <TypoSample label="label.mediumSM" font="Inter" size={13} lineHeight={12} weight={500} letterSpacing={0} />
        <TypoSample label="label.regularTN" font="Inter" size={12} lineHeight={12} weight={400} letterSpacing={0} />
        <TypoSample label="label.semiboldXS" font="Inter" size={11} lineHeight={12} weight={600} letterSpacing={0} />
        <TypoSample label="label.mediumXS" font="Inter" size={11} lineHeight={12} weight={500} letterSpacing={0} />
      </div>
    </Section>

    {/* ── UTILITY (Champ) ── */}
    <Section title="Utility · Champ">
      <div className="p-6 rounded-xl bg-card border border-border space-y-0">
        <TypoSample label="utility.buttonXL" font="Champ" size={20} lineHeight={24} weight={800} letterSpacing={-0.1} sample="BUTTON TEXT" />
      </div>
    </Section>
  </div>
);

/* ─── ATOMS ──────────────────────────────────────── */

const AtomsSection = () => (
  <div className="space-y-12">
    {/* Buttons */}
    <Section title="Tlačítka – Shadcn varianty">
      <div className="flex flex-wrap gap-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </Section>

    <Section title="Tlačítka – Full-width primární">
      <div className="space-y-4 max-w-md">
        <button className="w-full py-4 rounded-full bg-primary text-primary-foreground font-champ font-bold text-lg hover:opacity-90 transition-opacity">
          Procvičit slovíčka
        </button>
        <button className="w-full py-4 rounded-full bg-secondary text-foreground font-champ font-bold text-lg hover:bg-muted transition-colors">
          Spustit video lekci
        </button>
        <button className="w-full py-4 rounded-full bg-destructive text-destructive-foreground font-champ font-bold text-lg hover:opacity-90 transition-opacity">
          Smazat
        </button>
      </div>
    </Section>

    <Section title="Icon tlačítka">
      <div className="flex gap-3">
        <Button variant="ghost" size="icon" className="rounded-full bg-card"><X className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-card"><Volume2 className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-card"><Languages className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-card"><Flag className="w-5 h-5" /></Button>
      </div>
    </Section>

    {/* Badges */}
    <Section title="Stat Badges">
      <div className="flex flex-wrap gap-4">
        <div className="stat-badge stat-badge-fire"><Flame className="w-5 h-5" /><span>130</span></div>
        <div className="stat-badge stat-badge-freeze"><Snowflake className="w-5 h-5" /><span>12</span></div>
        <div className="level-selector"><span>A1-A2</span><ChevronDown className="w-4 h-4" /></div>
      </div>
    </Section>

    <Section title="Kategorie Badges">
      <div className="flex flex-wrap gap-3">
        <CategoryBadge name="Konverzace" color="bg-primary/20 text-primary border-primary/30" />
        <CategoryBadge name="Slang" color="bg-destructive/20 text-destructive border-destructive/30" />
        <CategoryBadge name="Gramatika" color="bg-accent/20 text-accent border-accent/30" />
      </div>
    </Section>

    {/* Progress */}
    <Section title="Progress Bar">
      <div className="space-y-4 max-w-md">
        <Progress value={30} className="h-3 bg-card" />
        <Progress value={60} className="h-3 bg-card" />
        <Progress value={100} className="h-3 bg-card" />
      </div>
    </Section>

    {/* Icons */}
    <Section title="Ikony – Navigace">
      <div className="flex flex-wrap gap-6">
        <IconDisplay icon={<LayoutGrid className="w-6 h-6" />} name="LayoutGrid" />
        <IconDisplay icon={<Layers className="w-6 h-6" />} name="Layers" />
        <IconDisplay icon={<Bookmark className="w-6 h-6" />} name="Bookmark" />
        <IconDisplay icon={<User className="w-6 h-6" />} name="User" />
      </div>
    </Section>

    <Section title="Ikony – Akce">
      <div className="flex flex-wrap gap-6">
        <IconDisplay icon={<Play className="w-6 h-6" />} name="Play" />
        <IconDisplay icon={<Lock className="w-6 h-6" />} name="Lock" />
        <IconDisplay icon={<Check className="w-6 h-6" />} name="Check" />
        <IconDisplay icon={<X className="w-6 h-6" />} name="X" />
        <IconDisplay icon={<Sparkles className="w-6 h-6" />} name="Sparkles" />
        <IconDisplay icon={<Volume2 className="w-6 h-6" />} name="Volume2" />
        <IconDisplay icon={<Trophy className="w-6 h-6" />} name="Trophy" />
        <IconDisplay icon={<Flame className="w-6 h-6 text-streak-fire" />} name="Flame" />
        <IconDisplay icon={<Snowflake className="w-6 h-6 text-streak-freeze" />} name="Snowflake" />
      </div>
    </Section>

    {/* Lesson Node */}
    <Section title="Lesson Node">
      <div className="flex gap-4">
        <div className="lesson-node"><Lock className="w-6 h-6 text-muted-foreground" /></div>
        <div className="lesson-node lesson-node-active"><Play className="w-6 h-6 text-primary" /></div>
        <div className="lesson-node"><Check className="w-6 h-6 text-primary" /></div>
      </div>
    </Section>
  </div>
);

/* ─── MOLECULES ──────────────────────────────────── */

const MoleculesSection = () => (
  <div className="space-y-12">
    {/* Quiz answer buttons */}
    <Section title="Odpověďová tlačítka (Quiz)">
      <div className="space-y-3 max-w-md">
        <button className="w-full p-4 rounded-full border-2 border-border bg-card text-center font-champ font-bold text-lg hover:border-primary/50 transition-all">
          Normální odpověď
        </button>
        <button className="w-full p-4 rounded-full border-2 border-primary bg-primary/10 text-center font-champ font-bold text-lg">
          Vybraná odpověď
        </button>
        <button className="w-full p-4 rounded-full border-2 border-primary bg-primary/10 text-center font-champ font-bold text-lg text-primary">
          ✓ Správná odpověď
        </button>
        <button className="w-full p-4 rounded-full border-2 border-destructive bg-destructive/10 text-center font-champ font-bold text-lg text-destructive">
          ✗ Špatná odpověď
        </button>
      </div>
    </Section>

    {/* Phrase card */}
    <Section title="Fráze karta">
      <div className="max-w-md p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/20">
        <p className="font-medium text-foreground mb-1 text-lg">What's your name?</p>
        <p className="text-sm text-muted-foreground">→ Jak se jmenuješ?</p>
      </div>
    </Section>

    {/* Result feedback */}
    <Section title="Feedback karty">
      <div className="space-y-4 max-w-md">
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-primary">Správně!</span>
          </div>
          <p className="text-muted-foreground text-sm italic">Výborně, tohle jsi zvládl na jedničku!</p>
        </div>

        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
              <X className="w-5 h-5 text-destructive-foreground" />
            </div>
            <span className="font-bold text-lg text-destructive">Špatně</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Správná odpověď: <span className="text-foreground font-medium">My name is</span>
          </p>
        </div>
      </div>
    </Section>

    {/* XP Badge */}
    <Section title="XP Badge">
      <div className="bg-primary/10 border border-primary/30 rounded-2xl px-6 py-3 inline-block">
        <p className="text-primary font-bold text-lg">+50 XP získáno</p>
      </div>
    </Section>

    {/* Hover effects */}
    <Section title="Hover efekty">
      <div className="flex flex-wrap gap-4">
        <div className="p-6 rounded-xl bg-card border border-border hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
          hover:scale
        </div>
        <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
          hover:border
        </div>
        <div className="p-6 rounded-xl bg-card border border-border hover:bg-muted transition-colors cursor-pointer">
          hover:bg
        </div>
        <div className="p-6 rounded-xl bg-primary glow-primary text-primary-foreground">
          glow-primary
        </div>
      </div>
    </Section>
  </div>
);

/* ─── ORGANISMS ──────────────────────────────────── */

const OrganismsSection = () => (
  <div className="space-y-12">
    {/* Complete Card */}
    <Section title="Complete Card">
      <div className="max-w-md p-6 rounded-2xl bg-card border border-border text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-primary" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <Star key={i} className={cn("w-8 h-8", i < 2 ? "text-primary fill-primary" : "text-muted-foreground/30")} />
          ))}
        </div>
        <p className="text-3xl font-black mb-1">4<span className="text-muted-foreground text-xl">/5</span></p>
        <p className="text-sm text-muted-foreground">správných odpovědí</p>
      </div>
    </Section>

    {/* Bottom Nav */}
    <Section title="Bottom Navigation">
      <div className="max-w-md mx-auto relative">
        <div className="bottom-nav relative" style={{ position: "relative" }}>
          <div className="nav-item nav-item-active">
            <LayoutGrid className="w-6 h-6" />
            <span className="text-xs font-medium">Lekce</span>
          </div>
          <div className="nav-item">
            <Layers className="w-6 h-6" />
            <span className="text-xs font-medium">Opáčko</span>
          </div>
          <div className="nav-item">
            <Bookmark className="w-6 h-6" />
            <span className="text-xs font-medium">Uložené</span>
          </div>
          <div className="nav-item">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profil</span>
          </div>
        </div>
      </div>
    </Section>

    {/* Stats Bar */}
    <Section title="Stats Bar">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border max-w-md">
        <div className="stat-badge stat-badge-fire"><Flame className="w-5 h-5" /><span>130</span></div>
        <div className="stat-badge stat-badge-freeze"><Snowflake className="w-5 h-5" /><span>12</span></div>
        <div className="ml-auto level-selector"><span>A1-A2</span><ChevronDown className="w-4 h-4" /></div>
      </div>
    </Section>

    {/* Lesson List Item */}
    <Section title="Lesson List Item">
      <div className="max-w-md space-y-3">
        <div className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border">
          <div className="lesson-node lesson-node-active shrink-0"><Play className="w-5 h-5 text-primary" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">Meeting New People</p>
            <p className="text-sm text-muted-foreground">Konverzace · A1</p>
          </div>
          <span className="text-xs text-primary font-semibold">+20 XP</span>
        </div>
        <div className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border opacity-60">
          <div className="lesson-node shrink-0"><Lock className="w-5 h-5 text-muted-foreground" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">British Slang 101</p>
            <p className="text-sm text-muted-foreground">Slang · A2</p>
          </div>
        </div>
      </div>
    </Section>
  </div>
);

/* ─── Helpers ────────────────────────────────────── */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-lg font-bold mb-6 text-muted-foreground uppercase tracking-wider text-xs">{title}</h2>
    {children}
  </section>
);

const ColorCard = ({ name, color, textColor, cssVar, border = false }: { name: string; color: string; textColor: string; cssVar: string; border?: boolean }) => (
  <div className={cn("p-4 rounded-xl", color, textColor, border && "border border-border")}>
    <div className={cn("w-12 h-12 rounded-full mb-3", color, border && "border border-border")} />
    <p className="font-semibold">{name}</p>
    <code className="text-xs opacity-70">{cssVar}</code>
  </div>
);

const CategoryBadge = ({ name, color }: { name: string; color: string }) => (
  <span className={cn("px-4 py-2 rounded-full text-sm font-semibold border", color)}>{name}</span>
);

const IconDisplay = ({ icon, name }: { icon: React.ReactNode; name: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">{icon}</div>
    <span className="text-xs text-muted-foreground">{name}</span>
  </div>
);

const AnimationDemo = ({ name }: { name: string }) => {
  const [key, setKey] = useState(0);
  return (
    <button onClick={() => setKey(k => k + 1)} className="p-4 rounded-xl bg-card border border-border text-center">
      <div key={key} className={cn("w-12 h-12 rounded-lg bg-primary mx-auto mb-2", name)} />
      <code className="text-xs text-muted-foreground">{name}</code>
    </button>
  );
};

export default DesignSystem;
