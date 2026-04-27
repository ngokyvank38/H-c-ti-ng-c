/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppTab } from './types';
import { ContentManager } from './components/ContentManager';
import { ExerciseVocab } from './components/ExerciseVocab';
import { ExerciseListen } from './components/ExerciseListen';
import { ExerciseComm } from './components/ExerciseComm';
import { BookOpen, Headphones, MessageSquare, ListTodo, GraduationCap, LogIn, LogOut, Key, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLessons } from './hooks/useLessons';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('content');
  const { lessons, loading, user, login, logout, saveLesson, deleteLesson } = useLessons();
  const [loginInput, setLoginInput] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.length === 6) {
      login(loginInput);
    }
  };

  const tabs = [
    { id: 'content', label: 'Bài học', icon: <BookOpen size={20} /> },
    { id: 'vocab', label: 'Từ vựng', icon: <ListTodo size={20} /> },
    { id: 'listen', label: 'Luyện nghe', icon: <Headphones size={20} /> },
    { id: 'comm', label: 'Giao tiếp', icon: <MessageSquare size={20} /> },
  ];

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted font-bold text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-border-base flex-col p-6 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary">DeutschMaster</h1>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold text-text-light uppercase tracking-wider mb-3">Quản lý</p>
              <nav className="space-y-1">
                {tabs.slice(0, 1).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AppTab)}
                    className={`nav-item-sleek w-full group ${activeTab === tab.id ? 'nav-item-active' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${activeTab === tab.id ? 'bg-primary' : 'bg-text-light'}`}></div>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div>
              <p className="text-[11px] font-bold text-text-light uppercase tracking-wider mb-3">Luyện tập</p>
              <nav className="space-y-1">
                {tabs.slice(1).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AppTab)}
                    className={`nav-item-sleek w-full group ${activeTab === tab.id ? 'nav-item-active' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${activeTab === tab.id ? 'bg-primary' : 'bg-text-light'}`}></div>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="card-sleek bg-primary-light/50 border-primary-light p-4">
            <div className="flex justify-between text-[11px] font-bold text-text-muted mb-2 uppercase">
              <span>Tiến độ bài học</span>
              <span>{lessons.length} bài</span>
            </div>
            <div className="h-1.5 w-full bg-border-base rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${Math.min(lessons.length * 10, 100)}%` }}
              ></div>
            </div>
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-rose-500 font-bold text-xs hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-border-base">
          <div className="flex items-center gap-4">
            <div className="md:hidden w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={18} />
            </div>
            <h2 className="text-lg font-bold text-text-main truncate">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
             {user ? (
               <div className="flex items-center gap-3">
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-text-light uppercase tracking-tighter">ID Của bạn</span>
                    <span className="text-sm font-bold text-primary font-mono">{user}</span>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                   <Key size={14} />
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-xs font-bold text-text-light">
                 <LogIn size={14} /> Chưa đăng nhập
               </div>
             )}
          </div>
        </header>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex bg-white border-b border-border-base overflow-x-auto no-scrollbar">
          <div className="flex px-4 py-2 gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AppTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-light text-primary'
                    : 'text-text-muted hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {user ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'content' && (
                  <ContentManager 
                    lessons={lessons} 
                    onSave={saveLesson} 
                    onDelete={deleteLesson} 
                  />
                )}
                {activeTab === 'vocab' && <ExerciseVocab content={lessons} />}
                {activeTab === 'listen' && <ExerciseListen content={lessons} />}
                {activeTab === 'comm' && <ExerciseComm content={lessons} />}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-8 text-center max-w-sm mx-auto">
              <div className="w-20 h-20 bg-primary-light/30 rounded-3xl flex items-center justify-center text-primary">
                <GraduationCap size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-main">DeutschMaster</h3>
                <p className="text-sm text-text-muted">Nhập mã ID 6 chữ số của bạn để truy cập và quản lý bài học.</p>
              </div>
              
              <form onSubmit={handleLogin} className="w-full space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Mã ID 6 chữ số"
                    className="w-full bg-white border-2 border-border-base rounded-xl py-3 px-4 text-center text-2xl font-mono tracking-[0.5em] focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-sm placeholder:tracking-normal placeholder:font-sans"
                  />
                  {loginInput.length === 6 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg"
                    >
                      <ArrowRight size={20} />
                    </motion.button>
                  )}
                </div>
                <p className="text-[10px] text-text-light italic">
                  Nếu bạn chưa có mã, hãy nhập bất kỳ 6 chữ số nào để bắt đầu hành trình mới!
                </p>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
