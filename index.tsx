
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- 1. 类型定义 (Types) ---
enum GameMode { SOLO = 'SOLO', DUO = 'DUO', AI_VS_AI = 'AI_VS_AI' }
enum Side { PRO = 'PRO', CON = 'CON' }

interface Debater {
  id: string; name: string; description: string; style: string; avatar: string;
}

interface Message {
  role: 'system' | 'user' | 'ai';
  content: string; senderName: string; timestamp: number; side?: Side;
  sources?: { uri: string; title: string }[];
}

interface CoachAnalysis {
  userLogic: string; opponentLogic: string; rebuttalStrategies: string[];
  goldenSentences: string[]; slangOrMeme: string; supportRate: number;
}

// --- 2. 核心数据 (Constants) ---
const DEBATERS: Debater[] = [
  { id: 'cm', name: '尘鸣', description: '呼唤爱与真理。', style: '理性与感性平衡，擅长升华价值。', avatar: 'https://picsum.photos/seed/cm/200/200' },
  { id: 'hzz', name: '皇智忠', description: '少爷，心理学大师。', style: '擅长撕开事物表象，脑洞大开。', avatar: 'https://picsum.photos/seed/hzz/200/200' },
  { id: 'mww', name: '玛唯唯', description: '温柔一刀，言辞犀利。', style: '讽刺犀利，逻辑如剔骨钢刀。', avatar: 'https://picsum.photos/seed/mww/200/200' },
  { id: 'zqy', name: '占清芸', description: '学霸辩手，底蕴深厚。', style: '宏大叙事与细微情感交织。', avatar: 'https://picsum.photos/seed/zqy/200/200' },
  { id: 'fse', name: '付守儿', description: '人间清醒，段子手。', style: '生活化幽默，以情动人。', avatar: 'https://picsum.photos/seed/fse/200/200' },
  { id: 'xx', name: '萧霄', description: '少奶奶。', style: '直白深刻，情感爆发力强。', avatar: 'https://picsum.photos/seed/xx/200/200' },
  { id: 'qc', name: '秋宸', description: '逻辑怪。', style: '冷静丧萌，拨云见日。', avatar: 'https://picsum.photos/seed/qc/200/200' },
  { id: 'lqy', name: '凉秋阳', description: '思辨深度。', style: '拆解底层逻辑，精准打击。', avatar: 'https://picsum.photos/seed/lqy/200/200' },
  { id: 'fxt', name: '逢晓彤', description: '节奏大师。', style: '叙事性辩论，生活化表达。', avatar: 'https://picsum.photos/seed/fxt/200/200' },
  { id: 'oyc', name: '鸥阳潮', description: '咆哮逻辑。', style: '表演性极强，逻辑狂野。', avatar: 'https://picsum.photos/seed/oyc/200/200' },
  { id: 'rgm', name: '染高鸣', description: '金句达人。', style: '草根视角，歇后语连发。', avatar: 'https://picsum.photos/seed/rgm/200/200' },
  { id: 'xl', name: '晓璐', description: '幽默消解。', style: '用脱口秀解构严肃。', avatar: 'https://picsum.photos/seed/xl/200/200' },
  { id: 'dw', name: '达旺', description: '情感爆发。', style: '直觉驱动，极具感染力。', avatar: 'https://picsum.photos/seed/dw/200/200' },
  { id: 'zhf', name: '藏红菲', description: '摇滚视角。', style: '真性情，直率犀利。', avatar: 'https://picsum.photos/seed/zhf/200/200' },
  { id: 'xr', name: '汐锐', description: '共情细腻。', style: '关注被忽视的微光。', avatar: 'https://picsum.photos/seed/xr/200/200' },
  { id: 'hjb', name: '弧渐飙', description: '辩论神明。', style: '逻辑严丝合缝，教练级拆解。', avatar: 'https://picsum.photos/seed/hjb/200/200' },
  { id: 'lm', name: '萝描', description: '冷面笑匠。', style: '语调平稳但刀刀见血。', avatar: 'https://picsum.photos/seed/lm/200/200' },
  { id: 'xzf', name: '穴兆风', description: '理性模型。', style: '经济学逻辑看待万事。', avatar: 'https://picsum.photos/seed/xzf/200/200' },
  { id: 'cky', name: '裁康拥', description: '说话之道。', style: '温润如玉，化繁为简。', avatar: 'https://picsum.photos/seed/cky/200/200' },
  { id: 'ld', name: '黎淡', description: '人间不值得。', style: '解构荒诞，消解意义。', avatar: 'https://picsum.photos/seed/ld/200/200' },
  { id: 'cly', name: '尘岭跃', description: '主持大师。', style: '稳健大气中暗藏锋芒。', avatar: 'https://picsum.photos/seed/cly/200/200' },
  { id: 'shy', name: '拾红宇', description: '教科书派。', style: '学术严谨，逻辑锁死。', avatar: 'https://picsum.photos/seed/shy/200/200' },
  { id: 'md', name: '玛冬', description: '快乐议长。', style: '不正经讲大道理，消解严肃。', avatar: 'https://picsum.photos/seed/md/200/200' },
  { id: 'xh', name: '雄灏', description: '时空哲思。', style: '冲突解决专家，温柔打击。', avatar: 'https://picsum.photos/seed/xh/200/200' }
];

const RANDOM_TOPICS = ["应不应该支持年轻人‘断亲’？", "预知未来伴侣寿命要不要看？", "AI作品该享有版权吗？", "精致穷 vs 寒酸富？", "救100个普通人还是1个科学家？"];
const DANMU_POOL = ["这逻辑太丝滑了！", "少爷还是你少爷啊...", "金句，我悟了。", "对面逻辑碎了...", "教练我想学辩论！"];

// --- 3. AI 服务 (AI Services) ---
const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getDebaterResponse = async (topic: string, debater: Debater, side: Side, history: Message[]) => {
  const sideText = side === Side.PRO ? '正方' : '反方';
  const systemInstruction = `你现在是著名辩手 ${debater.name}。风格：${debater.style}。辩题：${topic}。立场：${sideText}。请在400字内发言。`;
  
  const contents = history.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'ai' ? 'model' : 'user' as const,
    parts: [{ text: `${m.senderName}: ${m.content}` }]
  }));
  if (contents.length === 0) contents.push({ role: 'user', parts: [{ text: "请开始你的开场陈词。" }] });
  else if (contents[contents.length - 1].role === 'model') contents.push({ role: 'user', parts: [{ text: "请继续发言。" }] });

  const response = await aiClient.models.generateContent({
    model: "gemini-3-flash-preview", contents, config: { systemInstruction, temperature: 0.8, tools: [{ googleSearch: {} }] }
  });

  let sources = [];
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    sources = response.candidates[0].groundingMetadata.groundingChunks.filter(c => c.web).map(c => ({ uri: c.web!.uri, title: c.web!.title }));
  }
  return { text: response.text || "...", sources };
};

const getCoachAnalysis = async (topic: string, userSide: Side, lastUserMsg: string, lastOpponentMsg: string): Promise<CoachAnalysis | null> => {
  const sideText = userSide === Side.PRO ? '正方' : '反方';
  const prompt = `分析辩论：辩题${topic}, 用户立场${sideText}, 用户言论${lastUserMsg}, 对手言论${lastOpponentMsg}`;
  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "你是一个辩论教练，以 JSON 格式输出：userLogic, opponentLogic, rebuttalStrategies (数组), goldenSentences (数组), slangOrMeme, supportRate (数字)。",
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text);
  } catch { return null; }
};

// --- 4. 组件 (Components) ---
const DanmuLayer = () => {
  const [danmus, setDanmus] = useState<{ id: number; text: string; top: string; speed: string }[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      setDanmus(prev => [...prev.slice(-8), { id: Date.now(), text: DANMU_POOL[Math.floor(Math.random() * DANMU_POOL.length)], top: `${Math.floor(Math.random() * 60 + 15)}%`, speed: `${Math.floor(Math.random() * 8 + 12)}s` }]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">{danmus.map(d => <div key={d.id} className="danmu-item" style={{ top: d.top, animationDuration: d.speed }}>{d.text}</div>)}</div>;
};

// --- 5. 主程序 (Main App) ---
const App = () => {
  const [view, setView] = useState<'HOME' | 'SETUP' | 'BATTLE'>('HOME');
  const [config, setConfig] = useState({ mode: GameMode.SOLO, topic: '', userSide: Side.PRO, opponent: DEBATERS[0], opponent2: DEBATERS[1], messages: [] as Message[], turn: 0, coach: null as CoachAnalysis | null });
  const [isThinking, setIsThinking] = useState(false);
  const [input, setInput] = useState('');
  const [editSide, setEditSide] = useState(Side.PRO);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [config.messages, isThinking]);

  const startBattle = () => {
    const msgs: Message[] = [{ role: 'system', senderName: 'CORE', content: `博弈场开启。辩题：${config.topic}`, timestamp: Date.now() }];
    setConfig(p => ({ ...p, messages: msgs, turn: 0 }));
    setView('BATTLE');
    if (config.mode === GameMode.SOLO) {
        setTimeout(() => runAi(msgs, config.opponent, config.userSide === Side.PRO ? Side.CON : Side.PRO), 1000);
    } else if (config.mode === GameMode.AI_VS_AI) {
        setTimeout(() => runAi(msgs, config.opponent, Side.PRO), 1000);
    }
  };

  const runAi = async (history: Message[], debater: Debater, side: Side) => {
    setIsThinking(true);
    const res = await getDebaterResponse(config.topic, debater, side, history);
    const msg: Message = { role: 'ai', senderName: debater.name, content: res.text, side, sources: res.sources, timestamp: Date.now() };
    setConfig(p => {
      const nextMsgs = [...p.messages, msg];
      const nextTurn = p.turn + (side === Side.CON ? 1 : 0);
      if (p.mode === GameMode.AI_VS_AI && nextTurn < MAX_ROUNDS) {
          setTimeout(() => runAi(nextMsgs, side === Side.PRO ? (p.opponent2 || DEBATERS[1]) : p.opponent, side === Side.PRO ? Side.CON : Side.PRO), 4000);
      }
      return { ...p, messages: nextMsgs, turn: nextTurn };
    });
    setIsThinking(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const msg: Message = { role: 'user', senderName: '我', content: input, side: config.userSide, timestamp: Date.now() };
    const nextMsgs = [...config.messages, msg];
    setConfig(p => ({ ...p, messages: nextMsgs }));
    setInput('');
    runAi(nextMsgs, config.opponent, config.userSide === Side.PRO ? Side.CON : Side.PRO);
    const aiLast = nextMsgs.filter(m => m.role === 'ai').pop()?.content || "";
    getCoachAnalysis(config.topic, config.userSide, input, aiLast).then(c => setConfig(p => ({ ...p, coach: c })));
  };

  const MAX_ROUNDS = 5;
  const currD = editSide === Side.PRO ? config.opponent : (config.opponent2 || DEBATERS[1]);

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-200">
      {view === 'HOME' && (
        <div className="flex flex-col items-center justify-center min-h-screen animate-in fade-in duration-1000">
          <h1 className="text-7xl font-black mb-4 text-orange-500">辩手训练场</h1>
          <p className="text-slate-600 tracking-[0.5em] mb-12">MINIMALIST LOGIC SPACE</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {[{id: GameMode.SOLO, t: 'AI 对垒'}, {id: GameMode.AI_VS_AI, t: '观摩博弈'}, {id: GameMode.DUO, t: '本地切磋'}].map(m => (
              <button key={m.id} onClick={() => { setConfig({...config, mode: m.id}); setView('SETUP'); }} className="glass p-10 rounded-[2rem] hover:border-orange-500/50 transition-all">
                <h3 className="text-xl font-bold">{m.t}</h3>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'SETUP' && (
        <div className="max-w-4xl mx-auto py-20 px-4">
          <div className="glass p-10 rounded-[3rem] space-y-8">
            <header className="flex justify-between border-b border-white/5 pb-4">
              <button onClick={() => setView('HOME')}><i className="fas fa-arrow-left"></i></button>
              <h2 className="text-[10px] tracking-widest uppercase text-orange-500">战备中心 // {config.mode}</h2>
              <div />
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] block mb-2 text-slate-500">博弈辩题</label>
                  <textarea className="w-full minimal-input p-4 rounded-xl h-24 outline-none text-xs" value={config.topic} onChange={e => setConfig({...config, topic: e.target.value})} placeholder="输入你的辩题..." />
                  <button onClick={() => setConfig({...config, topic: RANDOM_TOPICS[Math.floor(Math.random()*RANDOM_TOPICS.length)]})} className="text-[9px] text-orange-500 mt-2">随机抽取</button>
                </div>
                {config.mode === GameMode.AI_VS_AI && (
                  <div className="flex bg-white/5 p-1 rounded-xl">
                    <button onClick={() => setEditSide(Side.PRO)} className={`flex-1 py-2 text-[10px] rounded-lg ${editSide === Side.PRO ? 'bg-orange-500 text-black' : 'text-slate-500'}`}>正方选手</button>
                    <button onClick={() => setEditSide(Side.CON)} className={`flex-1 py-2 text-[10px] rounded-lg ${editSide === Side.CON ? 'bg-orange-500 text-black' : 'text-slate-500'}`}>反方选手</button>
                  </div>
                )}
                <button onClick={startBattle} disabled={!config.topic} className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs hover:bg-orange-500 transition-all">进入博弈</button>
              </div>
              <div className="space-y-4">
                <label className="text-[9px] block text-slate-500">选择辩手 (24位顶级 AI)</label>
                <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {DEBATERS.map(d => (
                    <button key={d.id} onClick={() => editSide === Side.PRO ? setConfig({...config, opponent: d}) : setConfig({...config, opponent2: d})} className={`flex flex-col items-center p-2 rounded-lg ${(editSide === Side.PRO ? config.opponent.id : config.opponent2.id) === d.id ? 'bg-orange-500/10' : 'opacity-40'}`}>
                      <img src={d.avatar} className="w-10 h-10 rounded-full mb-1" />
                      <span className="text-[8px]">{d.name}</span>
                    </button>
                  ))}
                </div>
                <div className="bg-white/5 p-4 rounded-xl text-[10px]">
                  <p className="text-orange-400 font-bold mb-1">{currD.name} · {currD.style}</p>
                  <p className="text-slate-400 italic">{currD.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'BATTLE' && (
        <div className="h-screen flex flex-col relative overflow-hidden">
          <DanmuLayer />
          <header className="h-20 glass flex items-center justify-between px-10 z-20">
            <button onClick={() => setView('HOME')} className="text-slate-500"><i className="fas fa-times"></i></button>
            <div className="text-center">
                <h1 className="text-[10px] font-black tracking-widest mb-1">{config.topic}</h1>
                <p className="text-[8px] text-slate-600">TURN {config.turn}/{MAX_ROUNDS}</p>
            </div>
            <div className="w-10" />
          </header>
          <main ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-12 z-10 custom-scrollbar">
            {config.messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.side === Side.PRO ? 'items-start' : m.side === Side.CON ? 'items-end' : 'items-center'}`}>
                {m.role === 'system' ? <div className="text-[8px] text-slate-600 tracking-[0.4em]">{m.content}</div> : (
                  <div className="max-w-[70%]">
                    <p className={`text-[8px] mb-2 font-black ${m.side === Side.PRO ? 'text-emerald-500' : 'text-rose-500'}`}>{m.senderName} · {m.side === Side.PRO ? '正方' : '反方'}</p>
                    <div className={`p-6 rounded-[2rem] text-[13px] border ${m.side === Side.PRO ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isThinking && <div className="text-[8px] animate-pulse">AI 正在思考...</div>}
          </main>
          {config.mode !== GameMode.AI_VS_AI && (
            <footer className="p-8 glass z-20">
              <div className="max-w-4xl mx-auto flex gap-4">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="flex-1 minimal-input p-4 rounded-full outline-none text-xs" placeholder="输入反击..." />
                <button onClick={handleSend} className="bg-orange-500 text-black w-12 h-12 rounded-full"><i className="fas fa-paper-plane"></i></button>
              </div>
            </footer>
          )}
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
