import { useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Database, FileText, ArrowLeft, ArrowUpDown, Filter, X, ChevronRight, Lightbulb, Zap, Brain, BookOpen, Code, Upload, RefreshCw, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { parseDatoCmsCSV, getLessonStats, type ParsedLesson } from "@/lib/csvParser";
import { toast } from "sonner";
import { SummaryDisplay } from "@/components/debug/SummaryDisplay";
import { ExercisesDisplay } from "@/components/debug/ExercisesDisplay";
import { GenerateExercisesPanel } from "@/components/debug/GenerateExercisesPanel";

interface DbLesson {
  id: string;
  datocms_id: string;
  video_upload_id: string;
  name: string;
  kind: string;
  order: number;
  level: string;
  cefr: string;
  summary: any;
  created_at: string;
  updated_at: string;
}

interface CachedExercise {
  id: string;
  lesson_id: string;
  lesson_name: string;
  lesson_category: string | null;
  exercises: any[];
  created_at: string;
  updated_at: string;
}

type SortField = 'order' | 'name' | 'created_at' | 'level';
type SortDirection = 'asc' | 'desc';
type MatchFilter = 'all' | 'matched' | 'unmatched';
type LevelFilter = 'all' | 'Zacatecnik' | 'Pokrocily' | 'Frajeris';

const DatoCmsDebug = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("lessons");
  
  // Detail panel state
  const [selectedLesson, setSelectedLesson] = useState<DbLesson | null>(null);
  const [selectedCache, setSelectedCache] = useState<CachedExercise | null>(null);
  const [detailView, setDetailView] = useState<'content' | 'prompt' | 'cache'>('content');
  
  // Lessons filters & sorting
  const [lessonSortField, setLessonSortField] = useState<SortField>('order');
  const [lessonSortDir, setLessonSortDir] = useState<SortDirection>('asc');
  const [lessonLevelFilter, setLessonLevelFilter] = useState<LevelFilter>('all');
  const [lessonCacheFilter, setLessonCacheFilter] = useState<MatchFilter>('all');
  
  // Cache filters & sorting
  const [cacheSortField, setCacheSortField] = useState<'created_at' | 'lesson_name'>('created_at');
  const [cacheSortDir, setCacheSortDir] = useState<SortDirection>('desc');
  const [cacheMatchFilter, setCacheMatchFilter] = useState<MatchFilter>('all');
  
  // CSV Import state
  const [csvParsedLessons, setCsvParsedLessons] = useState<ParsedLesson[] | null>(null);
  const [csvStats, setCsvStats] = useState<ReturnType<typeof getLessonStats> | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch all lessons with full data
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['debug-lessons-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) throw error;
      return data as DbLesson[];
    },
  });

  // Fetch cached exercises with full data
  const { data: cachedExercises = [], isLoading: cacheLoading } = useQuery({
    queryKey: ['debug-cache-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_exercises_cache')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CachedExercise[];
    },
  });

  // Check if cache entry matches a lesson
  const getCacheMatchStatus = (cacheItem: CachedExercise) => {
    const matchedLesson = lessons.find(
      l => l.datocms_id === cacheItem.lesson_id || l.video_upload_id === cacheItem.lesson_id
    );
    return matchedLesson ? { matched: true, lesson: matchedLesson } : { matched: false, lesson: null };
  };

  // Check if lesson has cached exercises
  const getLessonCache = (lesson: DbLesson) => {
    return cachedExercises.find(
      c => c.lesson_id === lesson.datocms_id || c.lesson_id === lesson.video_upload_id
    );
  };

  const lessonHasCache = (lesson: DbLesson) => !!getLessonCache(lesson);

  // Filter and sort lessons
  const filteredLessons = useMemo(() => {
    let result = [...lessons];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lesson => 
        lesson.name.toLowerCase().includes(query) ||
        lesson.datocms_id.toLowerCase().includes(query) ||
        lesson.video_upload_id.toLowerCase().includes(query) ||
        lesson.kind.toLowerCase().includes(query) ||
        lesson.level.toLowerCase().includes(query) ||
        lesson.cefr.toLowerCase().includes(query)
      );
    }
    
    if (lessonLevelFilter !== 'all') {
      result = result.filter(l => l.level === lessonLevelFilter);
    }
    
    if (lessonCacheFilter === 'matched') {
      result = result.filter(l => lessonHasCache(l));
    } else if (lessonCacheFilter === 'unmatched') {
      result = result.filter(l => !lessonHasCache(l));
    }
    
    result.sort((a, b) => {
      let comparison = 0;
      switch (lessonSortField) {
        case 'order':
          comparison = a.order - b.order;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'cs');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'level':
          const levelOrder = { 'Zacatecnik': 1, 'Pokrocily': 2, 'Frajeris': 3 };
          comparison = (levelOrder[a.level as keyof typeof levelOrder] || 0) - (levelOrder[b.level as keyof typeof levelOrder] || 0);
          break;
      }
      return lessonSortDir === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [lessons, searchQuery, lessonLevelFilter, lessonCacheFilter, lessonSortField, lessonSortDir, cachedExercises]);

  // Filter and sort cache
  const filteredCache = useMemo(() => {
    let result = [...cachedExercises];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(cache =>
        cache.lesson_name.toLowerCase().includes(query) ||
        cache.lesson_id.toLowerCase().includes(query) ||
        (cache.lesson_category?.toLowerCase().includes(query) ?? false)
      );
    }
    
    if (cacheMatchFilter === 'matched') {
      result = result.filter(c => getCacheMatchStatus(c).matched);
    } else if (cacheMatchFilter === 'unmatched') {
      result = result.filter(c => !getCacheMatchStatus(c).matched);
    }
    
    result.sort((a, b) => {
      let comparison = 0;
      switch (cacheSortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'lesson_name':
          comparison = a.lesson_name.localeCompare(b.lesson_name, 'cs');
          break;
      }
      return cacheSortDir === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [cachedExercises, searchQuery, cacheMatchFilter, cacheSortField, cacheSortDir, lessons]);

  // Stats
  const matchedCacheCount = cachedExercises.filter(c => getCacheMatchStatus(c).matched).length;
  const unmatchedCacheCount = cachedExercises.filter(c => !getCacheMatchStatus(c).matched).length;
  const lessonsWithCache = lessons.filter(l => lessonHasCache(l)).length;

  const toggleLessonSort = (field: SortField) => {
    if (lessonSortField === field) {
      setLessonSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setLessonSortField(field);
      setLessonSortDir('asc');
    }
  };

  const toggleCacheSort = (field: 'created_at' | 'lesson_name') => {
    if (cacheSortField === field) {
      setCacheSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setCacheSortField(field);
      setCacheSortDir(field === 'created_at' ? 'desc' : 'asc');
    }
  };

  const closeDetail = () => {
    setSelectedLesson(null);
    setSelectedCache(null);
  };

  const SortButton = ({ active, direction, onClick, children }: { active: boolean; direction: SortDirection; onClick: () => void; children: React.ReactNode }) => (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 hover:text-primary transition-colors",
        active && "text-primary font-semibold"
      )}
    >
      {children}
      <ArrowUpDown className={cn("w-3 h-3", active && (direction === 'desc' ? "rotate-180" : ""))} />
    </button>
  );

  const JsonBlock = ({ data, title }: { data: any; title: string }) => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h4>
      <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );

  const DetailField = ({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) => (
    <div className="py-2 border-b border-border">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-sm", mono && "font-mono text-xs break-all")}>{value}</div>
    </div>
  );

  // CSV Import handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const content = await file.text();
      const parsed = parseDatoCmsCSV(content);
      const stats = getLessonStats(parsed);
      
      setCsvParsedLessons(parsed);
      setCsvStats(stats);
      setActiveTab('import');
      
      toast.success(`Naparsováno ${parsed.length} lekcí z CSV`);
    } catch (err) {
      console.error('CSV parse error:', err);
      toast.error('Chyba při parsování CSV');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!csvParsedLessons || csvParsedLessons.length === 0) return;
    
    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-lessons-csv', {
        body: { lessons: csvParsedLessons, mode: 'replace' }
      });
      
      if (error) throw error;
      
      toast.success(`Importováno ${data.imported} lekcí!`);
      
      // Refresh lessons data
      queryClient.invalidateQueries({ queryKey: ['debug-lessons-full'] });
      
      // Clear parsed data
      setCsvParsedLessons(null);
      setCsvStats(null);
      setActiveTab('lessons');
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Chyba při importu: ' + (err instanceof Error ? err.message : 'Neznámá chyba'));
    } finally {
      setIsImporting(false);
    }
  };

  const isDetailOpen = selectedLesson || selectedCache;

  return (
    <div className="min-h-screen bg-background">
      <div className={cn("transition-all duration-300", isDetailOpen ? "mr-[500px]" : "")}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link to="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">DatoCMS Debug</h1>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat podle názvu, ID, kategorie..."
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl",
                "bg-muted/50 border border-border",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50"
              )}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="text-2xl font-bold">{lessons.length}</div>
              <div className="text-sm text-muted-foreground">Lekcí v DB</div>
            </div>
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="text-2xl font-bold">{cachedExercises.length}</div>
              <div className="text-sm text-muted-foreground">Cached cvičení</div>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-500">{lessonsWithCache}</div>
              <div className="text-sm text-muted-foreground">Lekcí s cvičením</div>
            </div>
            <div className="bg-green-500/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-500">{matchedCacheCount}</div>
              <div className="text-sm text-muted-foreground">Cache spárovaných</div>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-500">{unmatchedCacheCount}</div>
              <div className="text-sm text-muted-foreground">Cache nespárovaných</div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv"
            className="hidden"
          />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="lessons" className="gap-2">
                <Database className="w-4 h-4" />
                Lessons ({filteredLessons.length})
              </TabsTrigger>
              <TabsTrigger value="cache" className="gap-2">
                <FileText className="w-4 h-4" />
                Exercise Cache ({filteredCache.length})
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2">
                <Upload className="w-4 h-4" />
                Import CSV
              </TabsTrigger>
            </TabsList>

            {/* Lessons Table */}
            <TabsContent value="lessons">
              <div className="flex flex-wrap gap-3 mb-4 items-center">
                <Filter className="w-4 h-4 text-muted-foreground" />
                
                <Select value={lessonLevelFilter} onValueChange={(v) => setLessonLevelFilter(v as LevelFilter)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny levely</SelectItem>
                    <SelectItem value="Zacatecnik">Začátečník (A1-A2)</SelectItem>
                    <SelectItem value="Pokrocily">Pokročilý (B1-B2)</SelectItem>
                    <SelectItem value="Frajeris">Frajeris (C1-C2)</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={lessonCacheFilter} onValueChange={(v) => setLessonCacheFilter(v as MatchFilter)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Cache status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny</SelectItem>
                    <SelectItem value="matched">S cvičením</SelectItem>
                    <SelectItem value="unmatched">Bez cvičení</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1" />
                
                <span className="text-sm text-muted-foreground">
                  Zobrazeno: {filteredLessons.length} z {lessons.length}
                </span>
              </div>

              {lessonsLoading ? (
                <div className="text-center py-12 text-muted-foreground">Načítám...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">
                          <SortButton active={lessonSortField === 'order'} direction={lessonSortDir} onClick={() => toggleLessonSort('order')}>
                            Order
                          </SortButton>
                        </th>
                        <th className="text-left p-3 font-medium">
                          <SortButton active={lessonSortField === 'name'} direction={lessonSortDir} onClick={() => toggleLessonSort('name')}>
                            Název
                          </SortButton>
                        </th>
                        <th className="text-left p-3 font-medium">Kind</th>
                        <th className="text-left p-3 font-medium">
                          <SortButton active={lessonSortField === 'level'} direction={lessonSortDir} onClick={() => toggleLessonSort('level')}>
                            Level
                          </SortButton>
                        </th>
                        <th className="text-left p-3 font-medium">CEFR</th>
                        <th className="text-left p-3 font-medium">
                          <SortButton active={lessonSortField === 'created_at'} direction={lessonSortDir} onClick={() => toggleLessonSort('created_at')}>
                            Created
                          </SortButton>
                        </th>
                        <th className="text-left p-3 font-medium">Cache</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLessons.map((lesson) => (
                        <tr 
                          key={lesson.id} 
                          className={cn(
                            "border-t border-border hover:bg-muted/30 cursor-pointer transition-colors",
                            selectedLesson?.id === lesson.id && "bg-primary/10"
                          )}
                          onClick={() => { setSelectedLesson(lesson); setSelectedCache(null); }}
                        >
                          <td className="p-3 font-mono text-xs">{lesson.order}</td>
                          <td className="p-3 font-medium">{lesson.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-full bg-muted text-xs">
                              {lesson.kind}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              lesson.level === 'Zacatecnik' && "bg-green-500/20 text-green-600",
                              lesson.level === 'Pokrocily' && "bg-yellow-500/20 text-yellow-600",
                              lesson.level === 'Frajeris' && "bg-purple-500/20 text-purple-600"
                            )}>
                              {lesson.level}
                            </span>
                          </td>
                          <td className="p-3">{lesson.cefr}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {new Date(lesson.created_at).toLocaleDateString('cs-CZ')}
                          </td>
                          <td className="p-3">
                            {lessonHasCache(lesson) ? (
                              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                                ✓
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Cache Table */}
            <TabsContent value="cache">
              <div className="flex flex-wrap gap-3 mb-4 items-center">
                <Filter className="w-4 h-4 text-muted-foreground" />
                
                <Select value={cacheMatchFilter} onValueChange={(v) => setCacheMatchFilter(v as MatchFilter)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Match status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny</SelectItem>
                    <SelectItem value="matched">Spárované</SelectItem>
                    <SelectItem value="unmatched">Nespárované</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1" />
                
                <span className="text-sm text-muted-foreground">
                  Zobrazeno: {filteredCache.length} z {cachedExercises.length}
                </span>
              </div>

              {cacheLoading ? (
                <div className="text-center py-12 text-muted-foreground">Načítám...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">
                          <SortButton active={cacheSortField === 'lesson_name'} direction={cacheSortDir} onClick={() => toggleCacheSort('lesson_name')}>
                            Lesson Name
                          </SortButton>
                        </th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-left p-3 font-medium">Exercises</th>
                        <th className="text-left p-3 font-medium">
                          <SortButton active={cacheSortField === 'created_at'} direction={cacheSortDir} onClick={() => toggleCacheSort('created_at')}>
                            Created
                          </SortButton>
                        </th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCache.map((cache) => {
                        const match = getCacheMatchStatus(cache);
                        return (
                          <tr 
                            key={cache.id} 
                            className={cn(
                              "border-t border-border hover:bg-muted/30 cursor-pointer transition-colors",
                              selectedCache?.id === cache.id && "bg-primary/10"
                            )}
                            onClick={() => { setSelectedCache(cache); setSelectedLesson(null); }}
                          >
                            <td className="p-3">
                              {match.matched ? (
                                <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                                  ✓
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-medium">
                                  ✗
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-medium">{cache.lesson_name}</td>
                            <td className="p-3">
                              <span className="px-2 py-1 rounded-full bg-muted text-xs">
                                {cache.lesson_category || '—'}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {Array.isArray(cache.exercises) ? cache.exercises.length : 0} cvičení
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                              {new Date(cache.created_at).toLocaleDateString('cs-CZ')}
                            </td>
                            <td className="p-3">
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Import Tab */}
            <TabsContent value="import">
              <div className="space-y-6">
                {/* Upload button */}
                <div className="flex items-center gap-4">
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Nahrát DatoCMS CSV
                  </Button>
                  {csvParsedLessons && (
                    <span className="text-sm text-muted-foreground">
                      {csvParsedLessons.length} lekcí připraveno k importu
                    </span>
                  )}
                </div>

                {/* Stats from parsed CSV */}
                {csvStats && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Statistiky z CSV:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 rounded-xl p-4">
                        <div className="text-2xl font-bold">{csvStats.total}</div>
                        <div className="text-sm text-muted-foreground">Celkem lekcí</div>
                      </div>
                      <div className="bg-green-500/10 rounded-xl p-4">
                        <div className="text-2xl font-bold text-green-500">{csvStats.byLevel.Zacatecnik || 0}</div>
                        <div className="text-sm text-muted-foreground">Začátečník</div>
                      </div>
                      <div className="bg-yellow-500/10 rounded-xl p-4">
                        <div className="text-2xl font-bold text-yellow-500">{csvStats.byLevel.Pokrocily || 0}</div>
                        <div className="text-sm text-muted-foreground">Pokročilý</div>
                      </div>
                      <div className="bg-purple-500/10 rounded-xl p-4">
                        <div className="text-2xl font-bold text-purple-500">{csvStats.byLevel.Frajeris || 0}</div>
                        <div className="text-sm text-muted-foreground">Frajeris</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-amber-600">Upozornění</div>
                          <div className="text-sm text-muted-foreground">
                            Import smaže všechny stávající lekce a nahradí je daty z CSV ({csvStats.total} lekcí).
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleImport} 
                      disabled={isImporting}
                      className="gap-2"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Importuji...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Importovat {csvStats.total} lekcí
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!csvParsedLessons && (
                  <div className="text-center py-12 text-muted-foreground">
                    Nahraj DatoCMS CSV export pro zobrazení náhledu
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Detail Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-[500px] bg-background border-l border-border z-50",
          "transform transition-transform duration-300 ease-out",
          isDetailOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {isDetailOpen && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-lg truncate pr-4">
                {selectedLesson?.name || selectedCache?.lesson_name}
              </h2>
              <button 
                onClick={closeDetail}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Filter Chips - only for lessons */}
            {selectedLesson && (
              <div className="flex gap-2 p-3 border-b border-border bg-muted/30">
                <button
                  onClick={() => setDetailView('content')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5",
                    detailView === 'content'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted text-muted-foreground"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Obsah
                </button>
                <button
                  onClick={() => setDetailView('prompt')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5",
                    detailView === 'prompt'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Brain className="w-3.5 h-3.5" />
                  Prompt
                </button>
                <button
                  onClick={() => setDetailView('cache')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1.5",
                    detailView === 'cache'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted text-muted-foreground",
                    getLessonCache(selectedLesson) && "ring-1 ring-green-500/50"
                  )}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Cvičení
                  {getLessonCache(selectedLesson) && (
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                </button>
              </div>
            )}
            
            {/* Content */}
            <ScrollArea className="flex-1 p-4">
              {selectedLesson && (
                <div>
                  {/* CONTENT VIEW */}
                  {detailView === 'content' && (
                    <>
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-primary mb-3">Základní informace</h3>
                        <DetailField label="ID (DB)" value={selectedLesson.id} mono />
                        <DetailField label="DatoCMS ID" value={selectedLesson.datocms_id} mono />
                        <DetailField label="Video Upload ID" value={selectedLesson.video_upload_id} mono />
                        <DetailField label="Název" value={selectedLesson.name} />
                        <DetailField label="Kind" value={selectedLesson.kind} />
                        <DetailField label="Order" value={selectedLesson.order} />
                        <DetailField label="Level" value={
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            selectedLesson.level === 'Zacatecnik' && "bg-green-500/20 text-green-600",
                            selectedLesson.level === 'Pokrocily' && "bg-yellow-500/20 text-yellow-600",
                            selectedLesson.level === 'Frajeris' && "bg-purple-500/20 text-purple-600"
                          )}>
                            {selectedLesson.level}
                          </span>
                        } />
                        <DetailField label="CEFR" value={selectedLesson.cefr} />
                        <DetailField label="Created" value={new Date(selectedLesson.created_at).toLocaleString('cs-CZ')} />
                        <DetailField label="Updated" value={new Date(selectedLesson.updated_at).toLocaleString('cs-CZ')} />
                      </div>
                      
                      {/* User-friendly Summary Display */}
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Summary
                        </h3>
                        <SummaryDisplay summary={selectedLesson.summary} />
                      </div>
                      
                      {/* Collapsible Raw JSON */}
                      <details className="mb-6 group">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                          <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                          Zobrazit raw JSON
                        </summary>
                        <div className="mt-2">
                          <JsonBlock data={selectedLesson.summary} title="" />
                        </div>
                      </details>
                    </>
                  )}
                  
                  {/* PROMPT VIEW */}
                  {detailView === 'prompt' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Jak funguje prompt pro generování cvičení
                      </h3>
                      
                      {/* Step 1: Category Detection */}
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                          <h4 className="font-semibold text-blue-600 text-sm">Detekce kategorie lekce</h4>
                        </div>
                        <p className="text-xs text-muted-foreground ml-8">
                          Podle pole <code className="bg-muted px-1 rounded">kind</code> ("{selectedLesson.kind}") a názvu lekce se určí kategorie:
                        </p>
                        <div className="ml-8 mt-2 flex flex-wrap gap-2">
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            selectedLesson.kind.toLowerCase().includes('grammar') || 
                            selectedLesson.name.toLowerCase().match(/present|past|future|tense|verb/)
                              ? "bg-purple-500/20 text-purple-600"
                              : "bg-muted text-muted-foreground"
                          )}>
                            grammar
                          </span>
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            selectedLesson.kind.toLowerCase().match(/vocabulary|slang|phrases|words/)
                              ? "bg-green-500/20 text-green-600"
                              : "bg-muted text-muted-foreground"
                          )}>
                            vocabulary
                          </span>
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            selectedLesson.kind.toLowerCase().match(/conversation|speaking/)
                              ? "bg-yellow-500/20 text-yellow-600"
                              : "bg-muted text-muted-foreground"
                          )}>
                            conversation
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                            mixed (default)
                          </span>
                        </div>
                      </div>

                      {/* Step 2: Exercise Types */}
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                          <h4 className="font-semibold text-green-600 text-sm">Výběr typů cvičení</h4>
                        </div>
                        <p className="text-xs text-muted-foreground ml-8 mb-2">
                          Každá kategorie má povolené typy cvičení:
                        </p>
                        <div className="ml-8 text-xs space-y-1">
                          <div><strong>grammar:</strong> multiple-choice, translate-typing, word-bubbles</div>
                          <div><strong>vocabulary:</strong> matching-pairs, translate-typing, word-bubbles, multiple-choice</div>
                          <div><strong>conversation:</strong> translate-typing, word-bubbles, multiple-choice</div>
                          <div className="text-amber-600">⚠️ matching-pairs je ZAKÁZÁN pro grammar (automaticky filtrován)</div>
                        </div>
                      </div>

                      {/* Step 3: Context Building */}
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                          <h4 className="font-semibold text-yellow-600 text-sm">Sestavení kontextu</h4>
                        </div>
                        <div className="ml-8 text-xs space-y-2">
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-3 h-3 mt-0.5 text-yellow-600" />
                            <div>
                              <strong>Z summary.key_phrases:</strong> Klíčové fráze s překlady
                              <div className="text-muted-foreground mt-1">
                                {selectedLesson.summary?.key_phrases?.length 
                                  ? `${selectedLesson.summary.key_phrases.length} frází nalezeno`
                                  : "Žádné fráze (prázdné)"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Zap className="w-3 h-3 mt-0.5 text-yellow-600" />
                            <div>
                              <strong>Z summary.keywords:</strong> Klíčová slovíčka
                              <div className="text-muted-foreground mt-1">
                                {selectedLesson.summary?.keywords?.length 
                                  ? `${selectedLesson.summary.keywords.length} slov nalezeno`
                                  : "Žádná slovíčka (prázdné)"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-3 h-3 mt-0.5 text-yellow-600" />
                            <div>
                              <strong>Z summary.description:</strong> Popis lekce
                              <div className="text-muted-foreground mt-1">
                                {selectedLesson.summary?.description 
                                  ? `"${selectedLesson.summary.description.substring(0, 60)}..."`
                                  : "Žádný popis (prázdné)"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 4: Difficulty */}
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">4</span>
                          <h4 className="font-semibold text-purple-600 text-sm">Adaptivní obtížnost</h4>
                        </div>
                        <div className="ml-8 text-xs space-y-1">
                          <div><strong>beginner (A1-A2):</strong> Jednoduché věty, základní slovíčka</div>
                          <div><strong>intermediate (A2-B1):</strong> Středně složité věty</div>
                          <div><strong>advanced (B1-B2):</strong> Složitější věty, idiomy, frázová slovesa</div>
                          <div className="text-muted-foreground mt-2">
                            Obtížnost se určuje podle user_progress (level, mastery_level slov)
                          </div>
                        </div>
                      </div>

                      {/* Step 5: Semantic Rules */}
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">5</span>
                          <h4 className="font-semibold text-red-600 text-sm">Sémantická pravidla (kritické!)</h4>
                        </div>
                        <div className="ml-8 text-xs space-y-2">
                          <div className="p-2 bg-background rounded">
                            <strong>"Jak se máš?" vs "Jaký jsi?":</strong>
                            <div className="text-muted-foreground">
                              "I'm doing great" (pocit) ≠ "I'm great" (popis sebe)
                            </div>
                          </div>
                          <div className="p-2 bg-background rounded">
                            <strong>Tranzitivita sloves:</strong>
                            <div className="text-muted-foreground">
                              "I'm having dinner" ✓ vs "I'm dinner" ✗
                            </div>
                          </div>
                          <div className="p-2 bg-background rounded">
                            <strong>Přesné překlady:</strong>
                            <div className="text-muted-foreground">
                              "say" ≠ "tell", "make" ≠ "do", "best" ≠ "better"
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 6: Output */}
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">6</span>
                          <h4 className="font-semibold text-sm">Výstup a post-processing</h4>
                        </div>
                        <div className="ml-8 text-xs space-y-1">
                          <div>• AI vrací JSON array cvičení</div>
                          <div>• Options u multiple-choice se náhodně zamíchají</div>
                          <div>• matching-pairs se automaticky odfiltruje u grammar</div>
                          <div>• Výsledek se uloží do <code className="bg-muted px-1 rounded">lesson_exercises_cache</code></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* CACHE/EXERCISES VIEW */}
                  {detailView === 'cache' && (
                    <>
                      {(() => {
                        const cache = getLessonCache(selectedLesson);
                        if (cache) {
                          return (
                            <div>
                              <h3 className="text-sm font-semibold text-green-500 mb-3">✓ Cached cvičení</h3>
                              <DetailField label="Cache ID" value={cache.id} mono />
                              <DetailField label="Category" value={cache.lesson_category || '—'} />
                              <DetailField label="Počet cvičení" value={Array.isArray(cache.exercises) ? cache.exercises.length : 0} />
                              <DetailField label="Vytvořeno" value={new Date(cache.created_at).toLocaleString('cs-CZ')} />
                              <DetailField label="Aktualizováno" value={new Date(cache.updated_at).toLocaleString('cs-CZ')} />
                              
                              {/* User-friendly display */}
                              <div className="mt-4">
                                <ExercisesDisplay exercises={cache.exercises} />
                              </div>
                              
                              {/* Collapsible Raw JSON */}
                              <details className="mt-4 group">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                                  <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                                  Zobrazit raw JSON
                                </summary>
                                <JsonBlock data={cache.exercises} title="Exercises (JSON)" />
                              </details>
                            </div>
                          );
                        }
                        return (
                          <GenerateExercisesPanel 
                            lesson={selectedLesson} 
                            onGenerated={() => {
                              queryClient.invalidateQueries({ queryKey: ['debug-cache-full'] });
                            }}
                          />
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
              
              {selectedCache && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-primary mb-3">Cache informace</h3>
                    <DetailField label="Cache ID" value={selectedCache.id} mono />
                    <DetailField label="Lesson ID (v cache)" value={selectedCache.lesson_id} mono />
                    <DetailField label="Lesson Name" value={selectedCache.lesson_name} />
                    <DetailField label="Category" value={selectedCache.lesson_category || '—'} />
                    <DetailField label="Počet cvičení" value={Array.isArray(selectedCache.exercises) ? selectedCache.exercises.length : 0} />
                    <DetailField label="Created" value={new Date(selectedCache.created_at).toLocaleString('cs-CZ')} />
                  </div>
                  
                  {/* Show match status */}
                  {(() => {
                    const match = getCacheMatchStatus(selectedCache);
                    if (match.matched && match.lesson) {
                      return (
                        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                          <h3 className="text-sm font-semibold text-green-500 mb-2">✓ Spárováno s lekcí</h3>
                          <div className="text-sm">
                            <div><strong>Název:</strong> {match.lesson.name}</div>
                            <div><strong>DatoCMS ID:</strong> <span className="font-mono text-xs">{match.lesson.datocms_id}</span></div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <h3 className="text-sm font-semibold text-red-500 mb-2">✗ Nespárováno</h3>
                        <div className="text-sm text-muted-foreground">
                          Lesson ID "{selectedCache.lesson_id}" neexistuje v tabulce lessons
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* User-friendly Exercises Display */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Cvičení ({Array.isArray(selectedCache.exercises) ? selectedCache.exercises.length : 0})
                    </h3>
                    <ExercisesDisplay exercises={selectedCache.exercises} />
                  </div>
                  
                  {/* Collapsible Raw JSON */}
                  <details className="mb-6 group">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                      <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                      Zobrazit raw JSON
                    </summary>
                    <JsonBlock data={selectedCache.exercises} title="Exercises (JSON)" />
                  </details>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Backdrop for mobile */}
      {isDetailOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={closeDetail}
        />
      )}
    </div>
  );
};

export default DatoCmsDebug;
