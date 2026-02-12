import { Copy, Check, Sparkles, Image, Palette, Layout, Ban, Lightbulb, Brain, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface PromptLearning {
  id: string;
  feedback: string;
  word: string;
  success_count: number;
  created_at: string;
}

const PromptImage = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [learnings, setLearnings] = useState<PromptLearning[]>([]);
  const [isLoadingLearnings, setIsLoadingLearnings] = useState(true);

  useEffect(() => {
    fetchLearnings();
  }, []);

  const fetchLearnings = async () => {
    setIsLoadingLearnings(true);
    const { data, error } = await supabase
      .from("prompt_learnings")
      .select("*")
      .order("success_count", { ascending: false });
    
    if (!error && data) {
      setLearnings(data as PromptLearning[]);
    }
    setIsLoadingLearnings(false);
  };

  const deleteLearning = async (id: string) => {
    const { error } = await supabase
      .from("prompt_learnings")
      .delete()
      .eq("id", id);
    
    if (!error) {
      setLearnings(prev => prev.filter(l => l.id !== id));
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sections = [
    {
      icon: Layout,
      title: "Struktura promptu",
      description: "Základní stavební bloky efektivního promptu",
      rules: [
        {
          rule: "Začni s hlavním subjektem",
          example: "A golden retriever puppy sitting in a meadow",
          tip: "Nejdůležitější prvek dej na začátek"
        },
        {
          rule: "Přidej styl/médium",
          example: "A golden retriever puppy, digital art illustration",
          tip: "Urči vizuální styl: photo, illustration, 3D render, watercolor..."
        },
        {
          rule: "Specifikuj detaily",
          example: "A golden retriever puppy with fluffy fur, big brown eyes, wearing a red collar",
          tip: "Čím víc detailů, tím přesnější výsledek"
        },
        {
          rule: "Definuj prostředí/pozadí",
          example: "...sitting in a sunlit meadow with wildflowers, soft bokeh background",
          tip: "Pozadí ovlivňuje celkovou atmosféru"
        },
        {
          rule: "Přidej osvětlení a atmosféru",
          example: "...golden hour lighting, warm tones, dreamy atmosphere",
          tip: "Světlo je klíčové pro náladu obrázku"
        }
      ]
    },
    {
      icon: Sparkles,
      title: "Styly a média",
      description: "Klíčová slova pro různé vizuální styly",
      rules: [
        {
          rule: "Fotorealistický",
          example: "photorealistic, hyperrealistic, DSLR photo, 85mm lens, f/1.8 aperture, professional photography",
          tip: "Přidej technické detaily fotoaparátu"
        },
        {
          rule: "Ilustrace",
          example: "digital illustration, vector art, flat design, minimalist illustration, hand-drawn sketch",
          tip: "Specifikuj typ ilustrace"
        },
        {
          rule: "3D render",
          example: "3D render, Pixar style, Blender render, octane render, cinema 4D, isometric 3D",
          tip: "Zmíň software nebo styl 3D"
        },
        {
          rule: "Umělecké styly",
          example: "oil painting, watercolor, acrylic, impressionist, art nouveau, pop art, anime style",
          tip: "Použij názvy uměleckých směrů"
        },
        {
          rule: "Sticker/ikona",
          example: "kawaii sticker, cute cartoon, chibi style, thick white outline, glossy highlights",
          tip: "Pro stickery vždy zmíň outline a highlights"
        }
      ]
    },
    {
      icon: Palette,
      title: "Barvy a osvětlení",
      description: "Jak správně popsat barevnost a světlo",
      rules: [
        {
          rule: "Barevná paleta",
          example: "vibrant colors, pastel palette, muted tones, monochromatic, complementary colors",
          tip: "Definuj celkovou barevnost"
        },
        {
          rule: "Specifické barvy",
          example: "deep navy blue, coral pink accents, gold metallic highlights",
          tip: "Buď konkrétní u důležitých barev"
        },
        {
          rule: "Typ osvětlení",
          example: "golden hour, blue hour, studio lighting, dramatic side lighting, soft diffused light",
          tip: "Osvětlení definuje náladu"
        },
        {
          rule: "Atmosféra",
          example: "moody, ethereal, vibrant, dark and mysterious, bright and cheerful",
          tip: "Přidej emocionální tón"
        },
        {
          rule: "Pozadí",
          example: "solid pure black background (#000000), gradient background, transparent background, bokeh",
          tip: "Pro stickery: solid black nebo white background"
        }
      ]
    },
    {
      icon: Image,
      title: "Kvalita a detaily",
      description: "Klíčová slova pro vysokou kvalitu",
      rules: [
        {
          rule: "Rozlišení a kvalita",
          example: "highly detailed, 4K, 8K resolution, ultra HD, masterpiece, best quality",
          tip: "Přidej na konec pro lepší kvalitu"
        },
        {
          rule: "Textury",
          example: "intricate details, fine textures, smooth gradients, sharp focus",
          tip: "Zmíň požadované textury"
        },
        {
          rule: "Kompozice",
          example: "centered composition, rule of thirds, symmetrical, dynamic angle, bird's eye view",
          tip: "Definuj úhel a kompozici"
        },
        {
          rule: "Poměr stran",
          example: "square format, portrait orientation, landscape 16:9, cinematic widescreen",
          tip: "DALL-E 3 podporuje 1024x1024, 1792x1024, 1024x1792"
        },
        {
          rule: "Okraje a rámování",
          example: "full body shot, close-up portrait, medium shot, with negative space around",
          tip: "Definuj jak moc subjekt vyplní obrázek"
        }
      ]
    },
    {
      icon: Ban,
      title: "Čemu se vyhnout",
      description: "Běžné chyby a jak je opravit",
      rules: [
        {
          rule: "Nepožaduj text v obrázku",
          example: "❌ 'logo with text HELLO' → ✅ 'abstract logo design, no text'",
          tip: "DALL-E špatně generuje text, vyhni se mu"
        },
        {
          rule: "Vyhni se příliš komplexním scénám",
          example: "❌ '10 characters doing different things' → ✅ '2-3 characters in clear scene'",
          tip: "Méně je více, drž scénu jednoduchou"
        },
        {
          rule: "Nebuď vágní",
          example: "❌ 'nice picture' → ✅ 'serene mountain landscape at sunset, oil painting style'",
          tip: "Konkrétní popisy = lepší výsledky"
        },
        {
          rule: "Vyhni se protichůdným instrukcím",
          example: "❌ 'realistic cartoon style' → ✅ 'semi-realistic illustration' nebo vyber jeden",
          tip: "Drž konzistentní styl"
        },
        {
          rule: "Nezapoměň na NO text/words/letters",
          example: "Important: NO text, NO words, NO letters, NO labels - only visual imagery",
          tip: "Explicitně zakázat text pro čisté obrázky"
        }
      ]
    },
    {
      icon: Lightbulb,
      title: "Pro tipy",
      description: "Pokročilé techniky pro lepší výsledky",
      rules: [
        {
          rule: "Použij referenční umělce (opatrně)",
          example: "in the style of Studio Ghibli, inspired by Monet, Pixar-style",
          tip: "Některé styly fungují lépe než jiné"
        },
        {
          rule: "Kombinuj více stylů",
          example: "cyberpunk aesthetic meets art nouveau, retro-futuristic",
          tip: "Unikátní kombinace = unikátní výsledky"
        },
        {
          rule: "Přidej emoce a akci",
          example: "joyful expression, running through rain, peaceful meditation",
          tip: "Dynamické popisy oživí obrázek"
        },
        {
          rule: "Specifikuj co NECHCEŠ",
          example: "no humans, no text, no watermarks, avoid dark colors",
          tip: "Negativní instrukce pomohou upřesnit"
        },
        {
          rule: "Iteruj a vylepšuj",
          example: "Pokud první výsledek není ideální, přidej 'more X' nebo 'less Y'",
          tip: "Použij regenerate s feedbackem"
        }
      ]
    }
  ];

  const examplePrompts = [
    {
      title: "Kawaii Sticker",
      prompt: `A cute kawaii sticker illustration of "CAT" (English vocabulary concept). 
Style: Cartoon sticker with thick white outline border around the entire design.
Colors: Bright vibrant colors, glossy highlights, cute and simple design.
Background: Solid pure black background (#000000).
Important: NO text, NO words, NO letters, NO labels - only visual imagery representing the concept.`,
    },
    {
      title: "Fotorealistický portrét",
      prompt: `Professional headshot portrait of a confident business woman in her 30s, 
wearing a navy blue blazer, natural makeup, warm smile.
Shot with Canon EOS R5, 85mm f/1.4 lens, studio lighting with soft key light.
Clean white background, sharp focus on eyes, shallow depth of field.
Photorealistic, high resolution, professional photography.`,
    },
    {
      title: "Fantasy ilustrace",
      prompt: `Epic fantasy landscape illustration of a floating island in the sky,
covered with ancient ruins and glowing crystal formations.
Waterfalls cascading into clouds below, aurora borealis in background.
Digital painting style, highly detailed, vibrant colors with purple and teal palette.
Cinematic lighting, magical atmosphere, 4K resolution, masterpiece quality.`,
    },
    {
      title: "Minimalistická ikona",
      prompt: `Simple minimalist icon of a lightning bolt,
flat design, single bold color (electric blue #0066FF),
geometric shapes, clean lines, no gradients.
Centered on pure white background, scalable vector style.
Modern UI icon aesthetic, no shadows, no 3D effects.`,
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-champ font-bold text-gradient-primary">
            DALL-E Prompt Guide
          </h1>
          <p className="text-muted-foreground mt-2">
            Pravidla pro generování kvalitních PNG obrázků
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Learned rules section - AI learns from your feedback */}
        {learnings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Naučená pravidla</h2>
                <p className="text-sm text-muted-foreground">
                  Automaticky se aplikují při generování stickerů
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
              <div className="space-y-2">
                {learnings.map((learning, index) => (
                  <div 
                    key={learning.id}
                    className="flex items-center justify-between gap-3 bg-card/50 rounded-xl px-4 py-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-mono text-xs">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {learning.feedback}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          z "{learning.word}"
                        </span>
                        <span className="text-xs text-primary/70">
                          • použito {learning.success_count}×
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(learning.feedback, 2000 + index)}
                        className="p-1.5 rounded-md hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {copiedIndex === 2000 + index ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteLearning(learning.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                💡 Tato pravidla se automaticky přidávají do každého promptu při generování stickerů
              </p>
            </div>
          </div>
        )}

        {isLoadingLearnings && (
          <div className="bg-card rounded-2xl p-6 border border-border animate-pulse">
            <div className="h-6 w-48 bg-secondary rounded mb-4" />
            <div className="space-y-2">
              <div className="h-12 bg-secondary/50 rounded-xl" />
              <div className="h-12 bg-secondary/50 rounded-xl" />
            </div>
          </div>
        )}

        {/* Formula section */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📐</span> Základní formule
          </h2>
          <div className="bg-secondary/50 rounded-xl p-4 font-mono text-sm overflow-x-auto">
            <span className="text-primary">[Subjekt]</span>
            {" + "}
            <span className="text-[hsl(var(--streak-fire))]">[Styl/Médium]</span>
            {" + "}
            <span className="text-[hsl(var(--streak-freeze))]">[Detaily]</span>
            {" + "}
            <span className="text-purple-400">[Prostředí]</span>
            {" + "}
            <span className="text-pink-400">[Osvětlení]</span>
            {" + "}
            <span className="text-muted-foreground">[Kvalita]</span>
          </div>
        </div>

        {/* Rules sections */}
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {section.rules.map((rule, ruleIndex) => {
                const globalIndex = sectionIndex * 100 + ruleIndex;
                return (
                  <div 
                    key={ruleIndex}
                    className="bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold">{rule.rule}</h3>
                        <div className="relative">
                          <code className="block bg-secondary/50 rounded-lg px-3 py-2 text-sm text-muted-foreground break-all">
                            {rule.example}
                          </code>
                          <button
                            onClick={() => copyToClipboard(rule.example, globalIndex)}
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-primary/20 transition-colors"
                          >
                            {copiedIndex === globalIndex ? (
                              <Check className="w-4 h-4 text-primary" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">💡 {rule.tip}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Example prompts */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-xl">📝</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Kompletní příklady</h2>
              <p className="text-sm text-muted-foreground">Hotové prompty ke kopírování</p>
            </div>
          </div>

          <div className="grid gap-4">
            {examplePrompts.map((example, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-primary">{example.title}</h3>
                  <button
                    onClick={() => copyToClipboard(example.prompt, 1000 + index)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      copiedIndex === 1000 + index 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary hover:bg-primary/20"
                    )}
                  >
                    {copiedIndex === 1000 + index ? (
                      <>
                        <Check className="w-4 h-4" />
                        Zkopírováno
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Kopírovat
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-secondary/50 rounded-lg p-3 text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                  {example.prompt}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Quick reference */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
          <h2 className="text-xl font-bold mb-4">⚡ Rychlá reference</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-primary mb-2">Vždy přidej:</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Hlavní subjekt na začátek</li>
                <li>• Styl/médium (photo, illustration...)</li>
                <li>• Kvalitativní slova (detailed, 4K...)</li>
                <li>• "NO text, NO words" pro čisté obrázky</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-destructive mb-2">Vyhni se:</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Text v obrázku (DALL-E to neumí)</li>
                <li>• Příliš mnoho subjektů najednou</li>
                <li>• Vágní popisy bez detailů</li>
                <li>• Protichůdné stylové instrukce</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptImage;
