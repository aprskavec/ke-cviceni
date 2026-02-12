import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import StatsBar from "@/components/StatsBar";
import LessonPlan from "@/components/LessonPlan";
import { LessonLevel } from "@/data/lessonMetadata";
import { useLessonCounts } from "@/hooks/useLessons";

const Index = () => {
  const [activeTab, setActiveTab] = useState("plan");
  const [selectedLevel, setSelectedLevel] = useState<LessonLevel>('Zacatecnik');

  // Get lesson counts from database
  const { data: lessonCounts } = useLessonCounts();
  const lessonCount = lessonCounts?.[selectedLevel] ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main content area */}
      <div className="px-5 pt-12 pb-4 max-w-6xl mx-auto">
        <StatsBar 
          streak={130} 
          freezes={12} 
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          lessonCount={lessonCount}
        />
        
        {activeTab === "plan" && <LessonPlan levelFilter={selectedLevel} />}
        
        {activeTab === "cards" && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
              <span className="text-3xl">🃏</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Kartičky</h2>
            <p className="text-muted-foreground">Brzy přidáme slovíčkové kartičky</p>
          </div>
        )}
        
        {activeTab === "saved" && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
              <span className="text-3xl">📚</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Uložené</h2>
            <p className="text-muted-foreground">Tvoje uložené lekce a slovíčka</p>
          </div>
        )}
        
        {activeTab === "profile" && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-4">
              <span className="text-4xl font-black text-primary-foreground">K</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Kuba</h2>
            <p className="text-muted-foreground">Profil a nastavení</p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
