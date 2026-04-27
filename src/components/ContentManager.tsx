import React, { useState } from 'react';
import { LessonContent, Vocabulary, GrammarPoint } from '../types';
import { Plus, Trash2, BookOpen, Edit, X, ClipboardList, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContentManagerProps {
  lessons: LessonContent[];
  onSave: (lesson: LessonContent) => void;
  onDelete: (id: string) => void;
}

export const ContentManager: React.FC<ContentManagerProps> = ({ lessons, onSave, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState<Partial<LessonContent>>({
    title: '',
    vocabulary: [],
    grammar: [],
  });

  const [tempVocab, setTempVocab] = useState<Vocabulary>({ german: '', vietnamese: '' });
  const [tempGrammar, setTempGrammar] = useState<GrammarPoint>({ title: '', explanation: '', examples: [] });
  const [editingItemIndex, setEditingItemIndex] = useState<{ type: 'vocabulary' | 'grammar', index: number } | null>(null);
  
  const [bulkInputType, setBulkInputType] = useState<'vocabulary' | 'grammar' | null>(null);
  const [bulkText, setBulkText] = useState('');

  const handleBulkImport = () => {
    if (!bulkInputType || !bulkText.trim()) return;

    const lines = bulkText.split('\n').filter(line => line.trim());
    const items = lines.map(line => {
      const parts = line.split(/[-:|]/).map(p => p.trim());
      if (bulkInputType === 'vocabulary') {
        return { 
          id: Math.random().toString(36).substr(2, 9),
          german: (parts[0] || '').replace(/\\\\/g, '\n'), 
          vietnamese: (parts[1] || parts[0] || '').replace(/\\\\/g, '\n') 
        } as Vocabulary;
      } else {
        const examples = parts[2] ? parts[2].split(';').map(e => e.trim().replace(/\\\\/g, '\n')) : [];
        return {
          id: Math.random().toString(36).substr(2, 9),
          title: (parts[0] || '').replace(/\\\\/g, '\n'),
          explanation: (parts[1] || '').replace(/\\\\/g, '\n'),
          examples: examples
        } as GrammarPoint;
      }
    });

    setNewLesson(prev => ({
      ...prev,
      [bulkInputType]: [...(prev[bulkInputType] as any[] || []), ...items]
    }));

    setBulkText('');
    setBulkInputType(null);
  };

  const handleBulkUpdate = () => {
    if (!bulkInputType || !bulkText.trim()) return;
    
    const lines = bulkText.split('\n').filter(line => line.trim());
    const items = lines.map(line => {
      const parts = line.split(/[-:|]/).map(p => p.trim());
      if (bulkInputType === 'vocabulary') {
        return { 
          id: Math.random().toString(36).substr(2, 9),
          german: (parts[0] || '').replace(/\\\\/g, '\n'), 
          vietnamese: (parts[1] || parts[0] || '').replace(/\\\\/g, '\n') 
        } as Vocabulary;
      } else {
        const examples = parts[2] ? parts[2].split(';').map(e => e.trim().replace(/\\\\/g, '\n')) : [];
        return {
          id: Math.random().toString(36).substr(2, 9),
          title: (parts[0] || '').replace(/\\\\/g, '\n'),
          explanation: (parts[1] || '').replace(/\\\\/g, '\n'),
          examples: examples
        } as GrammarPoint;
      }
    });

    setNewLesson(prev => ({
      ...prev,
      [bulkInputType]: items
    }));
    setBulkText('');
    setBulkInputType(null);
  };

  const startBulkEdit = (type: 'vocabulary' | 'grammar') => {
    setBulkInputType(type);
    let text = '';
    if (type === 'vocabulary') {
      text = (newLesson.vocabulary || []).map(v => `${v.german.replace(/\n/g, '\\\\')} - ${v.vietnamese.replace(/\n/g, '\\\\')}`).join('\n');
    } else {
      text = (newLesson.grammar || []).map(g => `${g.title.replace(/\n/g, '\\\\')} | ${g.explanation.replace(/\n/g, '\\\\')} | ${g.examples.map(e => e.replace(/\n/g, '\\\\')).join('; ')}`).join('\n');
    }
    setBulkText(text);
  };

  const handleEdit = (lesson: LessonContent) => {
    setNewLesson({
      title: lesson.title,
      vocabulary: [...lesson.vocabulary],
      grammar: [...lesson.grammar],
    });
    setEditId(lesson.id);
    setIsAdding(true);
  };

  const startEditItem = (type: 'vocabulary' | 'grammar', index: number) => {
    setEditingItemIndex({ type, index });
    if (type === 'vocabulary') {
      setTempVocab({ ...newLesson.vocabulary![index] });
    } else {
      const item = newLesson.grammar![index];
      setTempGrammar({ ...item });
    }
  };

  const cancelEditItem = () => {
    setEditingItemIndex(null);
    setTempVocab({ german: '', vietnamese: '' });
    setTempGrammar({ title: '', explanation: '', examples: [] });
  };

  const handleAddVocab = () => {
    if (tempVocab.german && tempVocab.vietnamese) {
      const vocabWithBreaks = {
        ...tempVocab,
        german: tempVocab.german.replace(/\\\\/g, '\n'),
        vietnamese: tempVocab.vietnamese.replace(/\\\\/g, '\n')
      };
      if (editingItemIndex?.type === 'vocabulary') {
        const newVocab = [...(newLesson.vocabulary || [])];
        newVocab[editingItemIndex.index] = { ...vocabWithBreaks };
        setNewLesson(prev => ({ ...prev, vocabulary: newVocab }));
        setEditingItemIndex(null);
      } else {
        setNewLesson(prev => ({
          ...prev,
          vocabulary: [...(prev.vocabulary || []), { ...vocabWithBreaks, id: Math.random().toString(36).substr(2, 9) }]
        }));
      }
      setTempVocab({ german: '', vietnamese: '' });
    }
  };

  const handleAddGrammar = () => {
    if (tempGrammar.title) {
      const grammarWithBreaks = {
        ...tempGrammar,
        title: tempGrammar.title.replace(/\\\\/g, '\n'),
        explanation: tempGrammar.explanation.replace(/\\\\/g, '\n'),
        examples: tempGrammar.examples.map(ex => ex.replace(/\\\\/g, '\n'))
      };
      if (editingItemIndex?.type === 'grammar') {
        const newGrammar = [...(newLesson.grammar || [])];
        newGrammar[editingItemIndex.index] = { ...grammarWithBreaks };
        setNewLesson(prev => ({ ...prev, grammar: newGrammar }));
        setEditingItemIndex(null);
      } else {
        setNewLesson(prev => ({
          ...prev,
          grammar: [...(prev.grammar || []), { ...grammarWithBreaks, id: Math.random().toString(36).substr(2, 9) }]
        }));
      }
      setTempGrammar({ title: '', explanation: '', examples: [] });
    }
  };

  const removeItem = (type: 'vocabulary' | 'grammar', index: number) => {
    setNewLesson(prev => ({
      ...prev,
      [type]: (prev[type] as any[]).filter((_, i) => i !== index)
    }));
    if (editingItemIndex?.type === type && editingItemIndex.index === index) {
      cancelEditItem();
    }
  };

  const handleSaveLesson = () => {
    if (newLesson.title) {
      const existingLesson = editId ? lessons.find(l => l.id === editId) : null;
      
      onSave({
        ...newLesson,
        id: editId || Date.now().toString(),
        date: existingLesson?.date || new Date().toLocaleDateString('vi-VN'),
        vocabulary: newLesson.vocabulary || [],
        grammar: newLesson.grammar || [],
      } as LessonContent);
      
      setNewLesson({ title: '', vocabulary: [], grammar: [] });
      setIsAdding(false);
      setEditId(null);
    }
  };

  const handleCancel = () => {
    setNewLesson({ title: '', vocabulary: [], grammar: [] });
    setIsAdding(false);
    setEditId(null);
    cancelEditItem();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-main">
          {editId ? 'Chỉnh sửa bài học' : 'Bài học đã lưu'}
        </h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="btn-primary-sleek flex items-center gap-2"
          >
            <Plus size={18} /> Thêm bài mới
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="card-sleek space-y-6"
          >
            <div className="space-y-6">
              <div className="border-b border-border-base pb-4">
                <p className="text-[10px] font-bold text-text-light uppercase tracking-wider mb-1">
                  {editId ? 'Sửa tiêu đề' : 'Tiêu đề bài học'}
                </p>
                <input
                  type="text"
                  placeholder="VD: Bài 1 - Chào hỏi"
                  className="w-full text-xl font-bold bg-transparent focus:outline-none placeholder:text-text-light"
                  value={newLesson.title}
                  onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                />
              </div>

              {/* Vocab Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-[11px] font-bold text-text-light uppercase tracking-wider">Từ vựng</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (bulkInputType === 'vocabulary') setBulkInputType(null);
                        else setBulkInputType('vocabulary');
                        setBulkText('');
                      }}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <ClipboardList size={12} />
                      {bulkInputType === 'vocabulary' ? 'Đóng' : 'Nhập hàng loạt'}
                    </button>
                    {(newLesson.vocabulary?.length || 0) > 0 && (
                      <button 
                        onClick={() => startBulkEdit('vocabulary')}
                        className="text-[10px] font-bold text-slate-500 hover:text-primary flex items-center gap-1"
                      >
                        <Edit size={12} />
                        Sửa hàng loạt
                      </button>
                    )}
                  </div>
                </div>

                {bulkInputType === 'vocabulary' ? (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Nhập theo định dạng: Tiếng Đức - Tiếng Việt (mỗi dòng 1 từ)"
                      className="w-full h-32 bg-slate-50 rounded-lg px-3 py-2 text-sm border border-slate-200 focus:border-primary focus:outline-none font-mono"
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={handleBulkImport}
                        className="text-xs bg-slate-100 text-text-muted px-3 py-1.5 rounded-md font-bold hover:bg-slate-200 transition-colors"
                      >
                        Thêm vào danh sách
                      </button>
                      <button 
                        onClick={handleBulkUpdate}
                        className="text-xs bg-primary text-white px-3 py-1.5 rounded-md font-bold hover:bg-primary-dark transition-colors"
                      >
                        Cập nhật toàn bộ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      placeholder="Tiếng Đức"
                      className="flex-1 bg-slate-50 rounded-lg px-3 py-2.5 text-sm border border-slate-200 focus:border-primary focus:outline-none"
                      value={tempVocab.german}
                      onChange={e => setTempVocab({ ...tempVocab, german: e.target.value })}
                    />
                    <input
                      placeholder="Nghĩa tiếng Việt"
                      className="flex-1 bg-slate-50 rounded-lg px-3 py-2.5 text-sm border border-slate-200 focus:border-primary focus:outline-none"
                      value={tempVocab.vietnamese}
                      onChange={e => setTempVocab({ ...tempVocab, vietnamese: e.target.value })}
                    />
                    {editingItemIndex?.type === 'vocabulary' && (
                      <button onClick={cancelEditItem} className="bg-slate-100 hover:bg-slate-200 p-2.5 rounded-lg transition-colors text-text-muted">
                        <X size={18} />
                      </button>
                    )}
                    <button onClick={handleAddVocab} className="bg-primary text-white p-2.5 rounded-lg transition-colors hover:bg-primary-dark">
                      {editingItemIndex?.type === 'vocabulary' ? <Check size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {newLesson.vocabulary?.map((v, i) => (
                    <div 
                      key={i} 
                      className={`group relative ${editingItemIndex?.type === 'vocabulary' && editingItemIndex.index === i ? 'bg-primary text-white' : 'bg-primary-light text-primary'} px-3 py-1 rounded-md text-xs font-bold border border-primary/10 pl-3 pr-12 transition-all cursor-pointer whitespace-pre-wrap`}
                      onClick={() => startEditItem('vocabulary', i)}
                    >
                      {v.german} <span className="mx-1 opacity-40">•</span> {v.vietnamese}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeItem('vocabulary', i); }}
                          className="p-0.5 hover:text-rose-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grammar Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-[11px] font-bold text-text-light uppercase tracking-wider">Ngữ pháp & Ví dụ</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (bulkInputType === 'grammar') setBulkInputType(null);
                        else setBulkInputType('grammar');
                        setBulkText('');
                      }}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <ClipboardList size={12} />
                      {bulkInputType === 'grammar' ? 'Đóng' : 'Nhập hàng loạt'}
                    </button>
                    {(newLesson.grammar?.length || 0) > 0 && (
                      <button 
                        onClick={() => startBulkEdit('grammar')}
                        className="text-[10px] font-bold text-slate-500 hover:text-primary flex items-center gap-1"
                      >
                        <Edit size={12} />
                        Sửa hàng loạt
                      </button>
                    )}
                  </div>
                </div>

                {bulkInputType === 'grammar' ? (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Định dạng: Tiêu đề | Giải thích | Ví dụ 1; Ví dụ 2"
                      className="w-full h-32 bg-slate-50 rounded-lg px-3 py-2 text-sm border border-slate-200 focus:border-primary focus:outline-none font-mono"
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={handleBulkImport}
                        className="text-xs bg-slate-100 text-text-muted px-3 py-1.5 rounded-md font-bold hover:bg-slate-200 transition-colors"
                      >
                        Thêm vào danh sách
                      </button>
                      <button 
                        onClick={handleBulkUpdate}
                        className="text-xs bg-primary text-white px-3 py-1.5 rounded-md font-bold hover:bg-primary-dark transition-colors"
                      >
                        Cập nhật toàn bộ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        placeholder="Tiêu đề ngữ pháp..."
                        className="flex-1 bg-slate-50 rounded-lg px-3 py-2.5 text-sm border border-slate-200 focus:border-primary focus:outline-none"
                        value={tempGrammar.title}
                        onChange={e => setTempGrammar({ ...tempGrammar, title: e.target.value })}
                      />
                      {editingItemIndex?.type === 'grammar' && (
                        <button onClick={cancelEditItem} className="bg-slate-100 hover:bg-slate-200 p-2.5 rounded-lg transition-colors text-text-muted">
                          <X size={18} />
                        </button>
                      )}
                      <button onClick={handleAddGrammar} className="bg-primary text-white p-2.5 rounded-lg transition-colors hover:bg-primary-dark">
                        {editingItemIndex?.type === 'grammar' ? <Check size={18} /> : <Plus size={18} />}
                      </button>
                    </div>
                    <textarea
                      placeholder="Giải thích ngữ pháp (không bắt buộc)..."
                      className="w-full bg-slate-50 rounded-lg px-3 py-2 text-sm border border-slate-200 focus:border-primary focus:outline-none h-16"
                      value={tempGrammar.explanation}
                      onChange={e => setTempGrammar({ ...tempGrammar, explanation: e.target.value })}
                    />
                    <textarea
                      placeholder="Các ví dụ (ngăn cách bởi dấu chấm phẩy ;)..."
                      className="w-full bg-slate-50 rounded-lg px-3 py-2 text-sm border border-slate-200 focus:border-primary focus:outline-none h-16"
                      value={tempGrammar.examples.join('; ')}
                      onChange={e => setTempGrammar({ ...tempGrammar, examples: e.target.value.split(';').map(ex => ex.trim()).filter(Boolean) })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  {newLesson.grammar?.map((g, i) => (
                    <div 
                      key={i} 
                      className={`group flex justify-between items-center ${editingItemIndex?.type === 'grammar' && editingItemIndex.index === i ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-text-muted'} px-3 py-3 rounded-lg text-sm border border-border-base font-medium hover:border-slate-300 transition-all cursor-pointer whitespace-pre-wrap`}
                      onClick={() => startEditItem('grammar', i)}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{g.title}</span>
                        {g.explanation && <span className="text-[11px] opacity-70 italic">{g.explanation}</span>}
                        {g.examples.length > 0 && <span className="text-[11px] opacity-70 mt-1">VD: {g.examples[0]}</span>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); removeItem('grammar', i); }} className="p-1 hover:text-rose-500">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border-base">
              <button
                onClick={handleSaveLesson}
                className="flex-1 btn-primary-sleek"
              >
                {editId ? 'Cập nhật bài học' : 'Hoàn tất & Lưu'}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-slate-100 text-text-muted py-2.5 rounded-lg hover:bg-slate-200 transition-all font-semibold"
              >
                Hủy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map(lesson => (
          <motion.div
            key={lesson.id}
            layout
            className="group card-sleek flex flex-col justify-between hover:border-primary/30 transition-all cursor-default"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em]">{lesson.date}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(lesson)}
                    className="text-text-light hover:text-primary transition-colors p-1"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(lesson.id)}
                    className="text-text-light hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-text-main mb-4 group-hover:text-primary transition-colors">{lesson.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <span className="block text-lg font-bold text-text-main">{lesson.vocabulary.length}</span>
                  <span className="text-[9px] font-bold text-text-light uppercase">Từ vựng</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <span className="block text-lg font-bold text-text-main">{lesson.grammar.length}</span>
                  <span className="text-[9px] font-bold text-text-light uppercase">Ngữ pháp</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {lessons.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-text-light shadow-sm border border-border-base">
              <BookOpen size={30} />
            </div>
            <div className="space-y-1">
              <p className="text-text-main font-bold">Chưa có bài học nào</p>
              <p className="text-text-muted text-sm px-4">Bắt đầu bằng cách thêm nội dung bài học tiếng Đức đầu tiên của bạn.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
