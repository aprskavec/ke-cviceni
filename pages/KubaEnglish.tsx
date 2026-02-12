import { useState } from "react";
import { ArrowLeft, Beer, Utensils, MessageCircle, Sparkles, Flame, Heart, Skull } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Kuba's moods/expressions
const kubaMoods = [
  { id: "happy", src: "/images/kuba/happy.png", label: "Šťastnej", description: "Když ti to jde" },
  { id: "cute-smile", src: "/images/kuba/cute-smile.png", label: "Roztomilej", description: "Rare moment" },
  { id: "angry", src: "/images/kuba/angry.png", label: "Naštvanej", description: "Když děláš chyby" },
  { id: "disgusted", src: "/images/kuba/disgusted.png", label: "Zhnusenej", description: "Při špatný gramatice" },
];

// Brand voice examples
const humorExamples = [
  {
    category: "Hospodský humor",
    icon: Beer,
    examples: [
      { czech: "Dám si pivo", english: "I'll have a beer", kuba: "Konečně něco užitečnýho!" },
      { czech: "Kde je nejbližší hospoda?", english: "Where's the nearest pub?", kuba: "Survival English 101" },
      { czech: "Ještě jedno!", english: "One more!", kuba: "Takhle se učí jazyky" },
    ]
  },
  {
    category: "Stěžování si",
    icon: MessageCircle,
    examples: [
      { czech: "To je drahý", english: "That's expensive", kuba: "Klasika v zahraničí" },
      { czech: "Proč to tak dlouho trvá?", english: "Why is it taking so long?", kuba: "Čech abroad be like..." },
      { czech: "U nás to děláme líp", english: "We do it better at home", kuba: "Národní sport" },
    ]
  },
  {
    category: "Jídlo (svaté)",
    icon: Utensils,
    examples: [
      { czech: "Svíčková s knedlíkem", english: "Sirloin with dumplings", kuba: "Peak civilization" },
      { czech: "Tohle není řízek", english: "This is not a schnitzel", kuba: "Kulturní šok" },
      { czech: "Kde je omáčka?", english: "Where's the sauce?", kuba: "Důležitá otázka" },
    ]
  },
];

// Kuba's personality traits
const personalityTraits = [
  {
    trait: "Drsný sarkasmus",
    icon: Flame,
    description: "Žádný oslazování. Říká věci na rovinu, i když to bolí.",
    example: "\"Hele, to slovo jsi zabil. Ale nevadí, zkusíme to znova.\""
  },
  {
    trait: "Typicky český",
    icon: Beer,
    description: "Reference na pivo, řízek, hospodu, stěžování. Prostě Čech.",
    example: "\"Angličtina je jako pivo – čím víc, tím líp.\""
  },
  {
    trait: "Brutální upřímnost",
    icon: Skull,
    description: "Nechválí zbytečně. Když to bylo blbý, řekne to.",
    example: "\"No... to byla katastrofa. Ale aspoň víš, na čem pracovat.\""
  },
  {
    trait: "Skrytá podpora",
    icon: Heart,
    description: "Pod drsným zevnějškem fandí. Když to zvládneš, ocení to.",
    example: "\"Kurňa, to bylo dobrý! Vidíš, že to jde.\""
  },
];

// Forbidden vs Allowed
const brandRules = {
  forbidden: [
    "Přehnaná pozitivita (\"Super! Skvělé! Amazing!\")",
    "Dětský jazyk a emotikony",
    "Formální/korporátní tón",
    "Anglicismy kde nejsou potřeba",
    "Politická korektnost za každou cenu",
  ],
  encouraged: [
    "Hospodská mluva a slang",
    "Sarkastické poznámky k chybám",
    "České kulturní reference",
    "Sebeironický humor",
    "Přímá zpětná vazba bez omáčky",
  ],
};

const KubaEnglish = () => {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-5 py-4 max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-black">Kubova Angličtina</h1>
            <p className="text-sm text-muted-foreground">Brand voice & humor guide</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 max-w-4xl mx-auto space-y-8">
        {/* Hero section with Kuba moods */}
        <section>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black mb-2">Kdo je Kuba?</h2>
            <p className="text-muted-foreground">
              Tvůj drsný, ale fér průvodce angličtinou. Žádný bullshit, jen upřímnost.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {kubaMoods.map((mood) => (
              <Card 
                key={mood.id}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  selectedMood === mood.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedMood(mood.id === selectedMood ? null : mood.id)}
              >
                <CardContent className="p-4 text-center">
                  <img 
                    src={mood.src} 
                    alt={mood.label}
                    className="w-20 h-20 mx-auto mb-2 object-contain"
                  />
                  <div className="font-bold text-sm">{mood.label}</div>
                  <div className="text-xs text-muted-foreground">{mood.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Personality traits */}
        <section>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Kubova osobnost
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {personalityTraits.map((trait) => (
              <Card key={trait.trait}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <trait.icon className="w-4 h-4 text-primary" />
                    {trait.trait}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{trait.description}</p>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm italic">
                    {trait.example}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Humor examples by category */}
        <section>
          <h2 className="text-xl font-black mb-4">Příklady Kubova humoru</h2>
          
          <div className="space-y-6">
            {humorExamples.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="w-5 h-5 text-primary" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.examples.map((example, idx) => (
                      <div key={idx} className="border-l-2 border-primary/30 pl-4">
                        <div className="flex flex-wrap gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">CZ: {example.czech}</Badge>
                          <Badge variant="secondary" className="text-xs">EN: {example.english}</Badge>
                        </div>
                        <div className="text-sm font-medium text-primary">
                          💬 Kuba: "{example.kuba}"
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Brand rules */}
        <section>
          <h2 className="text-xl font-black mb-4">Pravidla brand voice</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <Skull className="w-4 h-4" />
                  Zakázáno ❌
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {brandRules.forbidden.map((rule, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  Podporováno ✅
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {brandRules.encouraged.map((rule, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tagline */}
        <section className="text-center py-8">
          <div className="inline-block bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl px-8 py-6">
            <p className="text-2xl font-black mb-2">
              "Angličtina bez keců."
            </p>
            <p className="text-muted-foreground">
              — Kubova Angličtina, since forever
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default KubaEnglish;
