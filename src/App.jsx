import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Film, Plus, Loader, StopCircle, Clock, RefreshCw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

const socket = io({ autoConnect: false });

const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} - ${date.toLocaleDateString('vi-VN')}`;
};

const getStatusDisplay = (status) => {
    const statuses = {
        LIVE: { text: 'ĐANG PHÁT', color: 'text-green-400', bg: 'bg-green-900/50', icon: <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span> },
        COMPLETED: { text: 'HOÀN TẤT', color: 'text-gray-400', bg: 'bg-gray-700/80', icon: null },
        FAILED: { text: 'THẤT BẠI', color: 'text-red-400', bg: 'bg-red-900/50', icon: null },
        PENDING: { text: 'CHỜ PHÁT', color: 'text-yellow-400', bg: 'bg-yellow-900/50', icon: null },
        STOPPING: { text: 'ĐANG DỪNG', color: 'text-orange-400', bg: 'bg-orange-900/50', icon: <Loader className="w-4 h-4 animate-spin" /> },
        RETRYING: { text: 'ĐANG KẾT NỐI LẠI', color: 'text-blue-400', bg: 'bg-blue-900/50', icon: <RefreshCw className="w-4 h-4 animate-spin" /> }
    };
    return statuses[status] || { text: 'KHÔNG XÁC ĐỊNH', color: 'text-gray-500', bg: 'bg-gray-800' };
};

const CreateStreamForm = ({ handleSchedule, isScheduling }) => {
    const [formState, setFormState] = useState({
        title: '', videoIdentifier: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        streamKey: '', rtmpServer: 'rtmp://a.rtmp.youtube.com/live2',
        durationType: 'infinite', duration: 60,
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: '' }));
        }
    };

    const handleDurationTypeChange = (e) => {
        setFormState(prev => ({ ...prev, durationType: e.target.value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formState.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề';
        if (!formState.videoIdentifier.trim()) newErrors.videoIdentifier = 'Vui lòng nhập tên file video';
        if (!formState.date) newErrors.date = 'Vui lòng chọn ngày phát';
        if (!formState.time) newErrors.time = 'Vui lòng chọn giờ phát';
        if (!formState.rtmpServer.trim()) newErrors.rtmpServer = 'Vui lòng nhập RTMP Server';
        if (!formState.streamKey.trim()) newErrors.streamKey = 'Vui lòng nhập Stream Key';
        if (formState.durationType === 'custom' && (!formState.duration || formState.duration <= 0)) {
            newErrors.duration = 'Vui lòng nhập thời lượng hợp lệ';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // [SỬA ĐỔI] handleSubmit giờ đây sẽ sử dụng callback để reset form có điều kiện
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
            return;
        }
        
        handleSchedule(formState, (success) => {
            if (success) {
                setFormState(prev => ({
                    ...prev,
                    title: '',
                    videoIdentifier: '',
                    streamKey: '',
                    durationType: 'infinite',
                    duration: 60,
                }));
                setErrors({});
            }
            // Nếu không thành công, không làm gì cả để người dùng có thể sửa lỗi
        });
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col border border-gray-700">
            <h2 className="text-xl font-bold text-gray-100 flex items-center border-b border-gray-700 pb-4 flex-shrink-0">
                <Plus className="w-6 h-6 mr-3 text-blue-400" /> Lập Lịch Livestream Mới
            </h2>
            <div className="space-y-4 overflow-y-auto pr-2 flex-1 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Tiêu đề <span className="text-red-400">*</span></label>
						<input 
							type="text" 
							id="title" 
							value={formState.title} 
							onChange={handleChange} 
							placeholder="Stream Title" 
							className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
						/>
						{errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
					</div>
					<div>
						<label htmlFor="videoIdentifier" className="block text-sm font-medium text-gray-300 mb-1">Tên file Video <span className="text-red-400">*</span></label>
						<input 
							type="text" 
							id="videoIdentifier" 
							value={formState.videoIdentifier} 
							onChange={handleChange} 
							placeholder="VD: my_video_01.mp4" 
							className={`w-full px-3 py-2 border ${errors.videoIdentifier ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
						/>
						<p className="mt-1 text-xs text-yellow-400">
								Tên video live trong **D:\Live\videos** tại máy chủ
							</p>
						{errors.videoIdentifier && <p className="text-red-400 text-xs mt-1">{errors.videoIdentifier}</p>}
					</div>
				</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Ngày Phát <span className="text-red-400">*</span></label>
                        <input 
                            type="date" 
                            id="date" 
                            value={formState.date} 
                            onChange={handleChange} 
                            className={`w-full px-3 py-2 border ${errors.date ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
                        />
                        {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                    </div>
                    <div>
                        <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-1">Giờ Phát <span className="text-red-400">*</span></label>
                        <input 
                            type="time" 
                            id="time" 
                            value={formState.time} 
                            onChange={handleChange} 
                            className={`w-full px-3 py-2 border ${errors.time ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
                        />
                        {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label htmlFor="rtmpServer" className="block text-sm font-medium text-gray-300 mb-1">RTMP Server <span className="text-red-400">*</span></label>
						<input 
							type="text" 
							id="rtmpServer" 
							value={formState.rtmpServer} 
							onChange={handleChange} 
							placeholder="VD: rtmp://a.rtmp.youtube.com/live2" 
							className={`w-full px-3 py-2 border ${errors.rtmpServer ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
						/>
						{errors.rtmpServer && <p className="text-red-400 text-xs mt-1">{errors.rtmpServer}</p>}
					</div>
					<div>
						<label htmlFor="streamKey" className="block text-sm font-medium text-gray-300 mb-1">Stream Key <span className="text-red-400">*</span></label>
						<input 
							type="text" 
							id="streamKey" 
							value={formState.streamKey} 
							onChange={handleChange} 
							placeholder="Nhập khóa luồng" 
							className={`w-full px-3 py-2 border ${errors.streamKey ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
						/>
						{errors.streamKey && <p className="text-red-400 text-xs mt-1">{errors.streamKey}</p>}
					</div>
                </div>
                <div className="border-t border-gray-700 pt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-3">Thời Lượng Phát</label>
                    <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="radio" 
                                name="durationType" 
                                value="infinite" 
                                checked={formState.durationType === 'infinite'}
                                onChange={handleDurationTypeChange}
                                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-300">Tự động lặp vô hạn</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="radio" 
                                name="durationType" 
                                value="custom" 
                                checked={formState.durationType === 'custom'}
                                onChange={handleDurationTypeChange}
                                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-300">Thời gian tùy chọn</span>
                        </label>
                        
                        {formState.durationType === 'custom' && (
                            <div className="ml-7 mt-2">
                                <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">
                                    Thời lượng (phút)
                                </label>
                                <input 
                                    type="number" 
                                    id="duration" 
                                    min="1"
                                    value={formState.duration} 
                                    onChange={handleChange} 
                                    placeholder="VD: 60" 
                                    className={`w-full px-3 py-2 border ${errors.duration ? 'border-red-500' : 'border-gray-600'} bg-gray-900 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 transition`} 
                                />
                                {errors.duration && <p className="text-red-400 text-xs mt-1">{errors.duration}</p>}
                                <p className="text-xs text-gray-500 mt-1">Video sẽ lặp lại cho đến khi hết thời gian</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-700 flex-shrink-0">
                <button type="button" onClick={handleSubmit} disabled={isScheduling} className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed">
                    {isScheduling ? <><Loader className="w-5 h-5 mr-2 animate-spin" /> Đang xử lý...</> : <><Plus className="w-5 h-5 mr-2" /> Lên Lịch Ngay</>}
                </button>
            </div>
        </div>
    );
};

const StreamList = ({ schedules, handleDelete, handleStop }) => {
    const [showDebug, setShowDebug] = useState(false);
    const [processStats, setProcessStats] = useState(null);

    const handleGetStats = () => {
        socket.emit('get_process_stats');
    };

    useEffect(() => {
        socket.on('process_stats', (stats) => {
            setProcessStats(stats);
        });
        return () => socket.off('process_stats');
    }, []);

    return (
        <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col border border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-700 pb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-100 flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-blue-400" /> Quản lý Luồng ({schedules.length})
                </h2>
                <button
                    onClick={() => { setShowDebug(!showDebug); if (!showDebug) handleGetStats(); }}
                    className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition"
                >
                    {showDebug ? 'Ẩn' : 'Debug'}
                </button>
            </div>

            {showDebug && processStats && (
                <div className="mt-4 p-3 bg-gray-900 border border-gray-700 rounded text-xs space-y-2 flex-shrink-0">
                    <p className="text-gray-400">
                        <span className="font-semibold text-gray-300">Running Streams:</span> {processStats.running_streams_count}
                    </p>
                    <p className="text-gray-400">
                        <span className="font-semibold text-gray-300">Active PIDs:</span> {Object.values(processStats.schedule_pids || {}).join(', ') || 'None'}
                    </p>
                    {processStats.retry_counts && Object.keys(processStats.retry_counts).length > 0 && (
                        <p className="text-gray-400">
                            <span className="font-semibold text-gray-300">Retry Counts:</span> {JSON.stringify(processStats.retry_counts)}
                        </p>
                    )}
                    {processStats.ffmpeg_processes?.length > 0 && (
                        <div>
                            <p className="font-semibold text-gray-300 mb-1">FFmpeg Processes ({processStats.ffmpeg_processes.length}):</p>
                            <div className="bg-black p-2 rounded font-mono text-[10px] text-green-400 max-h-32 overflow-y-auto">
                                {processStats.ffmpeg_processes.map((line, i) => (
                                    <div key={i}>{line}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!schedules.length ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 italic">Chưa có lịch livestream nào.</div>
            ) : (
                <div className="space-y-4 overflow-y-auto flex-1 mt-4 pr-2">
                    {schedules.map((schedule) => {
                        const statusDisplay = getStatusDisplay(schedule.status);
                        const canStop = ['LIVE', 'RETRYING'].includes(schedule.status);
                        const canDelete = ['PENDING', 'COMPLETED', 'FAILED'].includes(schedule.status);
                        const durationText = schedule.durationMinutes ? `${schedule.durationMinutes} phút` : 'Vô hạn';
                        const pid = processStats?.schedule_pids?.[schedule.id];
                        
                        return (
                            <div key={schedule.id} className="p-4 border border-gray-700 rounded-lg bg-gray-900 flex flex-col space-y-4">
                                <div className="flex justify-between items-start">
                                    <p className="text-lg font-bold text-gray-100 truncate flex items-center">
                                        {statusDisplay.icon && <span className="mr-3 pl-4">{statusDisplay.icon}</span>}
                                        {schedule.title}
                                        {showDebug && pid && (
                                            <span className="ml-2 text-xs font-mono bg-gray-800 px-2 py-0.5 rounded text-blue-400">
                                                PID:{pid}
                                            </span>
                                        )}
                                    </p>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusDisplay.bg} ${statusDisplay.color}`}>{statusDisplay.text}</span>
                                </div>
                                <div className="text-sm text-gray-400 space-y-2 border-t border-gray-700/50 pt-3">
                                    <p className="flex items-center"><Clock size={14} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-300 mr-1">Phát lúc:</span> {formatDateTime(schedule.broadcastDateTime)}</p>
                                    <p className="flex items-center"><Film size={14} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-300 mr-1">File:</span> <span className="font-mono">{schedule.videoIdentifier}</span></p>
                                    <p className="flex items-center"><Clock size={14} className="mr-2 text-gray-500" /> <span className="font-semibold text-gray-300 mr-1">Thời lượng:</span> {durationText}</p>
                                </div>
                                {schedule.status === 'RETRYING' && (
                                    <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-3 text-xs text-blue-300">
                                        <p className="flex items-center">
                                            <Loader size={14} className="mr-2 animate-spin" />
                                            Đang thử kết nối lại... Hệ thống sẽ tự động retry.
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-center justify-end space-x-2 pt-2">
                                    {canStop && <button onClick={() => handleStop(schedule.id, schedule.title)} className="font-semibold py-1.5 px-3 rounded-md transition bg-yellow-600 hover:bg-yellow-700 text-white flex items-center text-xs"><StopCircle size={14} className="mr-1.5" /> Dừng</button>}
                                    {canDelete && <button onClick={() => handleDelete(schedule.id, schedule.title)} className="font-semibold py-1.5 px-3 rounded-md transition bg-red-600 hover:bg-red-700 text-white flex items-center text-xs"><Trash2 size={14} className="mr-1.5" /> Xóa</button>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const App = () => {
    const [schedules, setSchedules] = useState([]);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [isScheduling, setIsScheduling] = useState(false);
    const [actionToasts, setActionToasts] = useState({});
    const [activeTab, setActiveTab] = useState('create');

    // [SỬA ĐỔI] Tối ưu hóa useEffect để chỉ đăng ký listener một lần
    useEffect(() => {
        socket.connect();
        socket.on('connect', () => { setIsConnected(true); toast.success('Đã kết nối tới server!'); });
        socket.on('disconnect', () => { setIsConnected(false); toast.error('Mất kết nối tới server!'); });

        const handleBroadcastUpdate = (updatedSchedules) => {
            setSchedules(updatedSchedules);
            
            // Sử dụng functional update để lấy state mới nhất của actionToasts một cách an toàn
            setActionToasts(currentToasts => {
                const newToasts = {...currentToasts};
                let toastsChanged = false;
                
                Object.keys(currentToasts).forEach(scheduleId => {
                    const currentToastId = newToasts[scheduleId];
                    const updatedSchedule = updatedSchedules.find(s => s.id === scheduleId);
                    
                    if (updatedSchedule && updatedSchedule.status === 'COMPLETED') {
                        toast.success(`Đã dừng luồng "${updatedSchedule.title}" thành công!`, { id: currentToastId });
                        delete newToasts[scheduleId];
                        toastsChanged = true;
                    }
                });
                return toastsChanged ? newToasts : currentToasts;
            });
        };
        
        socket.on('broadcast_update', handleBroadcastUpdate);

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('broadcast_update', handleBroadcastUpdate);
            socket.disconnect();
        };
    }, []); // Dependency array rỗng đảm bảo hiệu ứng chỉ chạy một lần

    // [SỬA ĐỔI] Tích hợp logic acknowledgement vào handleSchedule
    const handleSchedule = (formState, callback) => {
        setIsScheduling(true);
        const toastId = toast.loading('Đang gửi và xác thực lịch trình...');

        const { date, time, duration, durationType, ...rest } = formState;
        const combinedDateTime = new Date(`${date}T${time}:00`).toISOString();
        const payload = { 
            ...rest, 
            broadcastDateTime: combinedDateTime, 
            durationMinutes: durationType === 'custom' ? parseInt(duration, 10) : null 
        };
        
        socket.emit('create_schedule', payload, (response) => {
            setIsScheduling(false);
            if (response && response.success) {
                toast.success(`Đã lên lịch "${formState.title}" thành công!`, { id: toastId });
                callback(true); 
                setActiveTab('manage');
            } else {
                // response.error có thể không tồn tại nếu có lỗi mạng
                const errorMessage = response ? response.error : 'Không nhận được phản hồi từ server.';
                toast.error(`Lỗi: ${errorMessage}`, { id: toastId, duration: 5000 });
                callback(false);
            }
        });
    };

    const handleStop = (id, title) => {
        if (!window.confirm(`Bạn có chắc muốn DỪNG livestream "${title}" không?`)) return;
        const toastId = toast.loading(`Đang gửi yêu cầu dừng "${title}"...`);
        setActionToasts(prev => ({ ...prev, [id]: toastId }));
        socket.emit('stop_schedule', { id });
    };

    const handleDelete = (id, title) => {
        if (!window.confirm(`Bạn có chắc muốn XÓA lịch trình "${title}" không?`)) return;
        toast.promise(
             new Promise(resolve => {
                socket.emit('delete_schedule', { id });
                setTimeout(resolve, 500);
             }), { loading: `Đang xóa "${title}"...`, success: `Đã xóa "${title}".`, error: 'Không thể xóa.' }
        );
    };

    const handleEmergencyStop = () => {
        if (!window.confirm('⚠️ CẢNH BÁO: Dừng KHẨN CẤP tất cả luồng?\n\nHành động này sẽ:\n- Dừng TẤT CẢ luồng đang phát\n- Kill mọi process FFmpeg\n- Không thể hoàn tác\n\nBạn có chắc chắn?')) return;
        
        toast.promise(
            new Promise(resolve => {
                socket.emit('emergency_stop_all');
                setTimeout(resolve, 1000);
            }),
            {
                loading: '🚨 Đang dừng khẩn cấp tất cả luồng...',
                success: '✅ Đã dừng khẩn cấp tất cả luồng!',
                error: '❌ Lỗi khi dừng khẩn cấp'
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-gray-900 text-gray-100 font-sans flex flex-col">
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb' } }} />
            
            <header className="w-full p-4 border-b border-gray-700/50 bg-gray-900 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">Youtube Livestream Manager</h1>
                    {schedules.some(s => ['LIVE', 'RETRYING'].includes(s.status)) && (
                        <button
                            onClick={handleEmergencyStop}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition flex items-center space-x-2 text-sm"
                        >
                            <StopCircle size={16} />
                            <span>Dừng Khẩn Cấp Tất Cả</span>
                        </button>
                    )}
                </div>
            </header>
            
            <main className="flex-1 overflow-hidden flex flex-col">
                <div className="border-b border-gray-700/50 bg-gray-800/50 px-4 md:px-6 lg:px-8">
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`px-6 py-3 font-semibold transition-all ${
                                activeTab === 'create'
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                            }`}
                        >
                            <Plus className="w-4 h-4 inline-block mr-2" />
                            Tạo Mới
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`px-6 py-3 font-semibold transition-all ${
                                activeTab === 'manage'
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                            }`}
                        >
                            <Calendar className="w-4 h-4 inline-block mr-2" />
                            Quản Lý ({schedules.length})
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
                    {activeTab === 'create' ? (
                        <div className="h-full max-w-4xl mx-auto">
                            <CreateStreamForm handleSchedule={handleSchedule} isScheduling={isScheduling} />
                        </div>
                    ) : (
                        <div className="h-full max-w-6xl mx-auto">
                            <StreamList schedules={schedules} handleDelete={handleDelete} handleStop={handleStop} />
                        </div>
                    )}
                </div>
            </main>
            
            <footer className="w-full p-3 border-t border-gray-700/50 bg-gray-900 flex-shrink-0">
                <p className="text-center text-xs text-gray-500">
                    Trạng thái kết nối: 
                    <span className={`font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                        {isConnected ? ' ● Connected' : ' ● Disconnected'}
                    </span>
                </p>
            </footer>
        </div>
    );
};

export default App;

