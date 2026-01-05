import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Calendar, MoreHorizontal, User, AlertCircle } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';
import toast from 'react-hot-toast';

const Tasks: React.FC = () => {
  const { tasks, staff, addTask, updateTask, deleteTask } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({ status: 'Todo', priority: 'Medium' });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: ''
  });

  const columns: { id: TaskStatus; title: string; bg: string; border: string; icon: React.ReactNode }[] = [
    { id: 'Todo', title: 'Yapılacaklar', bg: 'bg-slate-50/50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', icon: <Circle size={18} className="text-slate-500" /> },
    { id: 'InProgress', title: 'Sürüyor', bg: 'bg-blue-50/50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-800', icon: <Clock size={18} className="text-blue-500" /> },
    { id: 'Done', title: 'Tamamlandı', bg: 'bg-green-50/50 dark:bg-green-900/10', border: 'border-green-100 dark:border-green-800', icon: <CheckCircle2 size={18} className="text-green-500" /> },
  ];

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800';
      case 'Low': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600';
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Add a slight transparency to the dragged element visually
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) {
      const task = tasks.find(t => t.id === draggedTaskId);
      if (task && task.status !== status) {
        updateTask({ ...task, status });
        toast.success(`Görev taşındı.`);
      }
      setDraggedTaskId(null);
    }
  };

  const handleSave = () => {
    if (newTask.title) {
      const task: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: newTask.title,
        description: newTask.description || '',
        status: newTask.status as TaskStatus,
        priority: newTask.priority as TaskPriority,
        assigneeId: newTask.assigneeId,
        dueDate: newTask.dueDate
      };
      addTask(task);
      setIsModalOpen(false);
      setNewTask({ status: 'Todo', priority: 'Medium' });
      toast.success('Görev oluşturuldu.');
    } else {
      toast.error('Görev başlığı zorunludur.');
    }
  };

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      id,
      title
    });
  };

  const confirmDelete = () => {
    deleteTask(confirmModal.id);
    setConfirmModal({ isOpen: false, id: '', title: '' });
    toast.success('Görev silindi.');
  };

  return (
    <div className="space-y-8 h-[calc(100vh-8rem)] flex flex-col animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Görev Panosu</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Operasyonel iş takibi ve süreç yönetimi.</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>Yeni Görev</Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex h-full gap-6 min-w-[1000px]">
          {columns.map(col => (
            <div 
              key={col.id}
              className={`flex-1 flex flex-col rounded-3xl ${col.bg} border ${col.border} min-w-[320px] transition-colors duration-300 backdrop-blur-sm`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                     {col.icon}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{col.title}</span>
                </div>
                <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="p-4 pt-0 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                {tasks.filter(t => t.status === col.id).map(task => {
                    const assignee = staff.find(s => s.id === task.assigneeId);
                    
                    return (
                        <div 
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                            className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 hover:shadow-lg hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:-translate-y-1 cursor-grab active:cursor-grabbing transition-all duration-300 group relative"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${getPriorityStyle(task.priority)}`}>
                                    {task.priority === 'High' ? 'Acil' : task.priority === 'Medium' ? 'Normal' : 'Düşük'}
                                </span>
                                <button 
                                    onClick={(e) => handleDelete(task.id, task.title, e)} 
                                    className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 leading-snug">{task.title}</h4>
                            {task.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50 mt-auto">
                                <div className="flex items-center gap-2">
                                    {assignee ? (
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 pr-2 rounded-full border border-slate-100 dark:border-slate-600">
                                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                                {assignee.name.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 max-w-[60px] truncate">{assignee.name.split(' ')[0]}</span>
                                        </div>
                                    ) : (
                                        <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-500 flex items-center justify-center text-slate-400" title="Atanmamış">
                                            <User size={12} />
                                        </div>
                                    )}
                                </div>
                                
                                {task.dueDate && (
                                    <div className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg ${new Date(task.dueDate) < new Date() ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-slate-500 bg-slate-50 dark:bg-slate-700/50'}`}>
                                        <Calendar size={12} />
                                        {new Date(task.dueDate).toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'})}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {/* Empty State for Column */}
                {tasks.filter(t => t.status === col.id).length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
                        Görev yok
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Görev Oluştur"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button onClick={handleSave}>Oluştur</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label">Görev Başlığı</label>
            <input 
              className="input" 
              placeholder="Örn: Aylık Rapor Hazırlığı" 
              value={newTask.title || ''} 
              onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
            />
          </div>
          
          <div>
            <label className="label">Açıklama</label>
            <textarea 
              className="input min-h-[100px] resize-none leading-relaxed" 
              placeholder="Görev detayları..." 
              value={newTask.description || ''} 
              onChange={(e) => setNewTask({...newTask, description: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="label">Öncelik</label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    className="input pl-10 appearance-none"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value as TaskPriority})}
                >
                    <option value="Low">Düşük</option>
                    <option value="Medium">Orta</option>
                    <option value="High">Yüksek</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Atanan Kişi</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    className="input pl-10 appearance-none"
                    value={newTask.assigneeId || ''}
                    onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
                >
                    <option value="">Seçiniz...</option>
                    {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>
          
          <div>
             <label className="label">Bitiş Tarihi</label>
             <input 
                type="date"
                className="input"
                value={newTask.dueDate ? newTask.dueDate.split('T')[0] : ''}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
             />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="Görevi Sil"
        message={`"${confirmModal.title}" başlıklı görevi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Görevi Sil"
        variant="danger"
      />
    </div>
  );
};

export default Tasks;