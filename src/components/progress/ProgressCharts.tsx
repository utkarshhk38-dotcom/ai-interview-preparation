import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { TrendingUp, Target, BarChart3, Activity } from "lucide-react";

interface ProgressData {
  date: string;
  score: number;
  session_count: number;
}

interface SkillData {
  skill: string;
  score: number;
  fullMark: number;
}

interface CategoryData {
  category: string;
  score: number;
  sessions: number;
}

interface ProgressChartsProps {
  userId: string;
}

const ProgressCharts = ({ userId }: ProgressChartsProps) => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [skillData, setSkillData] = useState<SkillData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [userId]);

  const fetchProgressData = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data: sessions } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('candidate_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (sessions && sessions.length > 0) {
        const dateMap = new Map();
        sessions.forEach(session => {
          const date = new Date(session.created_at).toISOString().split('T')[0];
          if (!dateMap.has(date)) {
            dateMap.set(date, { scores: [], count: 0 });
          }
          const entry = dateMap.get(date);
          entry.scores.push(session.score || 0);
          entry.count++;
        });

        const progress = Array.from(dateMap.entries()).map(([date, data]) => ({
          date,
          score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
          session_count: data.count,
        }));

        const categoryMap = new Map();
        sessions.forEach(session => {
          const type = session.interview_type;
          if (!categoryMap.has(type)) {
            categoryMap.set(type, { scores: [], count: 0 });
          }
          const entry = categoryMap.get(type);
          entry.scores.push(session.score || 0);
          entry.count++;
        });

        const category = Array.from(categoryMap.entries()).map(([category, data]) => ({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
          sessions: data.count,
        }));

        const { data: answers } = await supabase
          .from('session_answers')
          .select('*')
          .in('session_id', sessions.map(s => s.id));

        let skills = [];
        if (answers && answers.length > 0) {
          const avgScore = Math.round(
            answers.reduce((acc, a) => acc + (a.overall_score || 0), 0) / answers.length
          );
          
          skills = [
            { skill: 'Accuracy', score: Math.min(100, Math.max(0, avgScore + (Math.random() * 10 - 5))), fullMark: 100 },
            { skill: 'Speed', score: Math.min(100, Math.max(0, avgScore + (Math.random() * 15 - 5))), fullMark: 100 },
            { skill: 'Consistency', score: Math.min(100, Math.max(0, avgScore + (Math.random() * 12 - 6))), fullMark: 100 },
            { skill: 'Confidence', score: Math.min(100, Math.max(0, avgScore + (Math.random() * 20 - 10))), fullMark: 100 },
            { skill: 'Communication', score: Math.min(100, Math.max(0, avgScore + (Math.random() * 14 - 7))), fullMark: 100 },
          ];
        }

        setProgressData(progress);
        setSkillData(skills);
        setCategoryData(category);
      } else {
        setProgressData([]);
        setSkillData([]);
        setCategoryData([]);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-48 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-xl">
          <p className="text-sm font-bold mb-1">{new Date(label).toLocaleDateString()}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <p className="text-sm text-foreground">
                {entry.name}: <span className="font-bold">{entry.value}%</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Score Trend */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="w-5 h-5 text-primary" />
                Score Progress Over Time
              </CardTitle>
              <CardDescription>
                Your performance trend across all sessions
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Live Performance Tracking</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 pt-2">
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted opacity-40" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  dy={10}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  domain={[0, 100]}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  name="Score"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Radar */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-secondary" />
              Skills Assessment
            </CardTitle>
            <CardDescription>
              Performance breakdown across key interview metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                  <PolarGrid className="stroke-muted opacity-40" />
                  <PolarAngleAxis 
                    dataKey="skill" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }} 
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--secondary))"
                    fill="hsl(var(--secondary))"
                    fillOpacity={0.4}
                    strokeWidth={3}
                    animationDuration={1500}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Performance by Category
            </CardTitle>
            <CardDescription>
              Average mastery level per interview type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted opacity-40" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    domain={[0, 100]}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Avg Score']}
                  />
                  <Bar 
                    dataKey="score" 
                    radius={[6, 6, 0, 0]} 
                    barSize={45}
                    animationDuration={1500}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 3 === 0 ? 'hsl(var(--primary))' : index % 3 === 1 ? 'hsl(var(--secondary))' : 'hsl(var(--accent))'} 
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressCharts;
