
import React from 'react';
import { CoachAnalysis } from '../types';

interface CoachPanelProps {
  analysis: CoachAnalysis | null;
  isOpen: boolean;
  onToggle: () => void;
}

const CoachPanel: React.FC<CoachPanelProps> = ({ analysis, isOpen, onToggle }) => {
  if (!analysis) return (
    <div className={`fixed right-8 top-24 bottom-24 w-80 glass rounded-[2rem] p-8 transition-all duration-700 z-30 shadow-2xl flex flex-col items-center justify-center border border-white/5 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[92%] opacity-40'}`}>
        <button onClick={onToggle} className="absolute left-[-20px] top-1/2 -translate-y-1/2 bg-orange-500 text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg"><i className="fas fa-brain animate-pulse"></i></button>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center font-bold">思辨分析师正在监听战局...</p>
    </div>
  );

  return (
    <div className={`fixed right-8 top-24 bottom-24 w-80 glass rounded-[2rem] p-8 transition-all duration-700 z-30 shadow-2xl flex flex-col border border-white/5 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[92%] opacity-100'}`}>
      <button onClick={onToggle} className="absolute left-[-20px] top-1/2 -translate-y-1/2 bg-orange-500 text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 z-40"><i className={`fas ${isOpen ? 'fa-chevron-right' : 'fa-brain'} animate-pulse`}></i></button>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[10px] font-black tracking-[0.4em] text-orange-500 uppercase">思辨分析师 // COACH</h2>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-emerald-500 font-black text-sm">{analysis.supportRate}%</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
        <section>
          <p className="text-[9px] text-slate-500 mb-3 uppercase tracking-widest font-black border-l-2 border-emerald-500 pl-2">逻辑解构</p>
          <div className="space-y-4">
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-emerald-400 font-bold mb-1 uppercase tracking-tighter">我方闪光</p>
                <p className="text-slate-300 text-xs leading-relaxed">{analysis.userLogic}</p>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-rose-400 font-bold mb-1 uppercase tracking-tighter">对方漏洞</p>
                <p className="text-slate-300 text-xs leading-relaxed">{analysis.opponentLogic}</p>
             </div>
          </div>
        </section>

        <section>
          <p className="text-[9px] text-orange-500 mb-3 uppercase tracking-widest font-black border-l-2 border-orange-500 pl-2">反击指令</p>
          <div className="space-y-3">
             {analysis.rebuttalStrategies.map((s, idx) => (
               <div key={idx} className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/10 text-xs text-slate-200 italic font-serif">“{s}”</div>
             ))}
          </div>
        </section>

        <section>
          <p className="text-[9px] text-sky-500 mb-3 uppercase tracking-widest font-black border-l-2 border-sky-500 pl-2">高级金句</p>
          <div className="space-y-4">
             {analysis.goldenSentences.map((s, idx) => (
                <p key={idx} className="text-slate-100 leading-relaxed font-serif text-[14px] px-2 italic">“{s}”</p>
             ))}
             <div className="bg-pink-500/10 p-4 rounded-2xl border border-pink-500/20 text-[11px] text-pink-300 font-black">
                <i className="fas fa-bolt mr-2"></i>{analysis.slangOrMeme}
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CoachPanel;
