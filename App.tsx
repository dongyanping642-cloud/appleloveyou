
import React, { useState, useEffect, useRef } from 'react';
import { GameMode, Side, GameState, Debater, Message, CoachAnalysis, TopicMethod, SavedBattle } from './types';
import { DEBATERS, RANDOM_TOPICS } from './constants';
import { getDebaterResponse, getCoachAnalysis } from './services/gemini';
import DanmuLayer from './components/DanmuLayer';
import CoachPanel from './components/CoachPanel';

const MAX_ROUNDS = 5;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'HOME' | 'SETUP' | 'BATTLE' | 'HISTORY'>('HOME');
  const [config, setConfig] = useState<GameState>({
    id: null, mode: GameMode.SOLO, topicMethod: TopicMethod.CLASSIC, topic: '', userSide: Side.PRO,
    opponent: DEBATERS[0], opponent2: DEBATERS[1], player1Name: '正方选手', player2Name: '反方选手',
    messages: [], isThinking: false, coachAnalysis: null, analysisHistory: [], turnCount: 0
  });

  const [inputMsg, setInputMsg] = useState('');
  const [showCoach, setShowCoach] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [history, setHistory] = useState<SavedBattle[]>([]);
  const [editingSide, setEditingSide] = useState<Side>(Side.PRO);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('debate_history');
    if (saved) { try { setHistory(JSON.parse(saved)); } catch (e) {} }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [config.messages, config.isThinking]);

  const launchBattle = () => {
    setIsGameOver(false);
    setShowCoach(true);
    const msgs: Message[] = [
      { role: 'system', senderName: 'CORE', content: '连接已建立。博弈场初始化完成。', timestamp: Date.now() },
      { role: 'system', senderName: '赛事导播', content: `辩题：${config.topic}`, timestamp: Date.now() + 100 }
    ];
    setConfig(prev => ({ ...prev, messages: msgs, analysisHistory: [], turnCount: 0 }));
    setGameState('BATTLE');

    if (config.mode === GameMode.SOLO) {
        const aiSide = config.userSide === Side.PRO ? Side.CON : Side.PRO;
        setTimeout(() => triggerAi(msgs, config.opponent, aiSide), 1000);
    } else if (config.mode === GameMode.AI_VS_AI) {
        setTimeout(() => triggerAi(msgs, config.opponent, Side.PRO), 1000);
    }
  };

  const triggerAi = async (msgs: Message[], debater: Debater, side: Side) => {
    if (isGameOver) return;
    setConfig(prev => ({ ...prev, isThinking: true }));
    try {
      const res = await getDebaterResponse(config.topic, debater, side, msgs);
      const aiMsg: Message = { 
        role: 'ai', senderName: debater.name, side: side,
        content: res.text, sources: res.sources, timestamp: Date.now() 
      };
      
      setConfig(prev => {
        const nextMsgs = [...prev.messages, aiMsg];
        const nextTurnCount = prev.turnCount + (side === Side.CON ? 1 : 0);
        const gameOver = nextTurnCount >= MAX_ROUNDS;
        if (gameOver) setIsGameOver(true);

        if (prev.mode === GameMode.AI_VS_AI && !gameOver) {
            const nextDebater = side === Side.PRO ? (prev.opponent2 || DEBATERS[1]) : prev.opponent;
            const nextSide = side === Side.PRO ? Side.CON : Side.PRO;
            setTimeout(() => triggerAi(nextMsgs, nextDebater, nextSide), 4000);
        }
        return { ...prev, messages: nextMsgs, isThinking: false, turnCount: nextTurnCount };
      });
    } catch (e) { setConfig(prev => ({ ...prev, isThinking: false })); }
  };

  const handleSend = async () => {
    if (!inputMsg.trim() || config.isThinking || isGameOver) return;
    
    const userMsg: Message = { role: 'user', senderName: '我', side: config.userSide, content: inputMsg, timestamp: Date.now() };
    const nextMsgs = [...config.messages, userMsg];
    
    setConfig(prev => ({ ...prev, messages: nextMsgs, isThinking: true }));
    setInputMsg('');
    
    const aiSide = config.userSide === Side.PRO ? Side.CON : Side.PRO;
    triggerAi(nextMsgs, config.opponent, aiSide);
    
    const lastAiMsg = nextMsgs.filter(m => m.role === 'ai').pop()?.content || "";
    getCoachAnalysis(config.topic, config.userSide, userMsg.content, lastAiMsg).then(a => {
        if (a) setConfig(p => ({ ...p, coachAnalysis: a, analysisHistory: [...p.analysisHistory, a] }));
    });
  };

  const currentEditingDebater = editingSide === Side.PRO ? config.opponent : (config.opponent2 || DEBATERS[1]);

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-200 font-sans selection:bg-orange-500/20">
      {gameState === 'HOME' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-10 animate-in fade-in duration-1000">
          <div className="text-center mb-20">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 uppercase">辩手训练场</h1>
            <p className="text-slate-600 tracking-[0.6em] text-[10px] uppercase font-light tracking-widest">Minimalist Logic Combat Space</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mb-12">
            {[
              { id: GameMode.SOLO, title: 'AI 对垒', desc: '向 24 位 AI 辩手发起挑战', icon: 'fa-robot' },
              { id: GameMode.AI_VS_AI, title: '观摩博弈', desc: '顶级 AI 相互博弈，围观学习', icon: 'fa-brain' },
              { id: GameMode.DUO, title: '本地切磋', desc: '双人面对面，定义你的战场', icon: 'fa-user-friends' }
            ].map(m => (
              <button key={m.id} onClick={() => { setConfig({...config, mode: m.id as GameMode}); setGameState('SETUP'); }} className="group glass p-10 rounded-[2.5rem] text-left hover:border-orange-500/40 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-orange-500/5">
                <i className={`fas ${m.icon} text-2xl text-orange-500 mb-6 group-hover:scale-110 transition-all`}></i>
                <h3 className="text-xl font-bold mb-2">{m.title}</h3>
                <p className="text-xs text-slate-500 font-light leading-relaxed">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'SETUP' && (
        <div className="max-w-5xl mx-auto min-h-screen flex flex-col justify-center p-4">
          <div className="glass p-8 md:p-12 rounded-[3.5rem] space-y-8 relative">
            <header className="flex justify-between items-center border-b border-white/5 pb-6">
                <button onClick={() => setGameState('HOME')} className="text-slate-500 hover:text-white"><i className="fas fa-arrow-left"></i></button>
                <h2 className="text-[10px] font-black tracking-[0.5em] uppercase text-orange-500">战备中心 // {config.mode}</h2>
                <div className="w-4"></div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6">
                <section className="space-y-3">
                  <div className="flex justify-between items-end">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">博弈主题</label>
                    <button onClick={() => setConfig({...config, topic: RANDOM_TOPICS[Math.floor(Math.random()*RANDOM_TOPICS.length)]})} className="text-[9px] text-orange-500 border-b border-orange-500/20">随机抽取</button>
                  </div>
                  <textarea className="w-full minimal-input rounded-2xl p-4 text-xs h-20 resize-none outline-none" value={config.topic} onChange={e => setConfig({...config, topic: e.target.value})} placeholder="输入你的核心辩题..." />
                </section>

                {config.mode === GameMode.AI_VS_AI && (
                  <section className="space-y-3">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">配置持方选手</label>
                    <div className="flex bg-white/5 rounded-2xl p-1.5 h-12">
                      <button onClick={() => setEditingSide(Side.PRO)} className={`flex-1 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${editingSide === Side.PRO ? 'bg-emerald-500 text-black shadow-lg' : 'text-slate-500 opacity-50'}`}>
                        <img src={config.opponent.avatar} className="w-5 h-5 rounded-full" /> 正方: {config.opponent.name}
                      </button>
                      <button onClick={() => setEditingSide(Side.CON)} className={`flex-1 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${editingSide === Side.CON ? 'bg-rose-500 text-black shadow-lg' : 'text-slate-500 opacity-50'}`}>
                        <img src={config.opponent2?.avatar} className="w-5 h-5 rounded-full" /> 反方: {config.opponent2?.name}
                      </button>
                    </div>
                  </section>
                )}
                
                <button onClick={launchBattle} disabled={!config.topic} className="w-full bg-white text-black py-4 rounded-3xl font-black tracking-[0.2em] hover:bg-orange-500 transition-all disabled:opacity-20 uppercase text-xs">
                    进入博弈
                </button>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                    {config.mode === GameMode.SOLO ? '选择你的 AI 对手' : `为 ${editingSide === Side.PRO ? '正方' : '反方'} 选择 AI`} (24位顶级辩手)
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                    {DEBATERS.map(d => {
                        const isSelected = config.mode === GameMode.SOLO ? config.opponent.id === d.id : (editingSide === Side.PRO ? config.opponent.id === d.id : config.opponent2?.id === d.id);
                        return (
                            <button key={d.id} onClick={() => { if(config.mode === GameMode.SOLO || editingSide === Side.PRO) setConfig({...config, opponent: d}); else setConfig({...config, opponent2: d}); }} className={`flex flex-col items-center transition-all ${isSelected ? 'scale-110' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}>
                                <img src={d.avatar} className={`w-12 h-12 rounded-full border-2 ${isSelected ? (editingSide === Side.PRO ? 'border-emerald-500' : 'border-rose-500') : 'border-transparent'}`} />
                                <span className="text-[8px] font-black mt-2 uppercase">{d.name}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 min-h-[80px]">
                    <p className="text-[10px] text-orange-400 font-bold mb-1 uppercase tracking-tighter">{currentEditingDebater.name} · 战术流派</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">{currentEditingDebater.description} —— {currentEditingDebater.style}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'BATTLE' && (
        <div className="h-screen flex flex-col relative overflow-hidden font-serif">
          <DanmuLayer />
          <CoachPanel analysis={config.coachAnalysis} isOpen={showCoach} onToggle={() => setShowCoach(!showCoach)} />
          <header className="h-20 glass flex items-center justify-between px-10 z-20 border-b border-white/5">
             <button onClick={() => setGameState('HOME')} className="text-slate-600 hover:text-white"><i className="fas fa-times"></i></button>
             <div className="text-center">
               <h1 className="text-[10px] font-black tracking-widest text-white mb-1 uppercase">{config.topic}</h1>
               <p className="text-[8px] text-slate-600 uppercase tracking-[0.4em]">TURN {config.turnCount}/{MAX_ROUNDS}</p>
             </div>
             <div className="w-10"></div>
          </header>

          <main ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-16 z-10 custom-scrollbar scroll-smooth">
            {config.messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.side === Side.PRO ? 'items-start' : m.side === Side.CON ? 'items-end' : 'items-center'}`}>
                {m.role === 'system' ? (
                  <div className="text-[8px] text-slate-600 uppercase tracking-[0.5em] font-bold border-b border-white/5 pb-2 mb-10 opacity-50">{m.content}</div>
                ) : (
                  <div className={`max-w-[75%] md:max-w-[55%] ${m.side === Side.PRO ? 'text-left' : 'text-right'}`}>
                    <div className={`flex items-center gap-2 mb-4 opacity-50 ${m.side === Side.CON ? 'flex-row-reverse' : ''}`}>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${m.side === Side.PRO ? 'text-emerald-500' : 'text-rose-500'}`}>{m.senderName} · {m.side === Side.PRO ? '正方' : '反方'}</span>
                    </div>
                    <div className={`p-8 rounded-[2.5rem] leading-[1.8] shadow-sm border ${m.side === Side.PRO ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-200' : 'bg-rose-500/5 border-rose-500/10 text-slate-200'}`}>
                      <p className="whitespace-pre-wrap text-[13px] tracking-wide">{m.content}</p>
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">参考来源 // SOURCES</p>
                          {m.sources.map((s, idx) => (
                            <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-orange-400 hover:text-orange-300 transition-colors truncate">
                              <i className="fas fa-external-link-alt mr-2 opacity-50"></i>{s.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {config.isThinking && (
              <div className="flex items-center gap-4 opacity-40 ml-2 animate-pulse">
                <div className="flex gap-1.5">{[0,1,2].map(j => <div key={j} className="w-1 h-1 bg-orange-500 rounded-full"></div>)}</div>
                <span className="text-[8px] uppercase tracking-widest font-black">AI 正在组织逻辑...</span>
              </div>
            )}
          </main>

          <footer className="p-10 glass z-20 border-t border-white/5">
            {isGameOver ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-orange-500 font-black text-[10px] tracking-[0.6em] uppercase">博弈终局 // TERMINATED</p>
                <button onClick={() => setGameState('HOME')} className="px-10 py-4 bg-white text-black rounded-3xl text-[9px] font-black tracking-widest uppercase hover:bg-orange-500 transition-colors">完成并保存</button>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto flex items-end gap-5">
                {config.mode !== GameMode.AI_VS_AI && (
                  <div className="flex-1 relative">
                    <textarea rows={1} value={inputMsg} onChange={e => setInputMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="输入你的反击观点..." className="w-full minimal-input rounded-[2.5rem] py-5 px-10 text-[13px] font-light focus:outline-none resize-none max-h-40 transition-all" />
                    <button onClick={handleSend} disabled={!inputMsg.trim() || config.isThinking} className="absolute right-4 bottom-3 w-11 h-11 bg-orange-500 rounded-2xl text-black flex items-center justify-center hover:scale-105 transition-all disabled:opacity-5">
                      <i className="fas fa-paper-plane text-xs"></i>
                    </button>
                  </div>
                )}
              </div>
            )}
          </footer>
        </div>
      )}
    </div>
  );
};

export default App;
