/* global __BUILD_TIME__ */
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, User, Flame, Calendar, Info, Database, Heart, Clock, PlusCircle, LogIn, LogOut, RefreshCw, Loader2 } from 'lucide-react';
import { initGoogleAPI, signIn, signOut, isSignedIn, getCurrentUser, readSheetData, appendSheetData, onSignInChange } from './services/googleSheets';

const App = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGapiReady, setIsGapiReady] = useState(false);
  const [isUserSignedIn, setIsUserSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    date: (() => {
      const now = new Date();
      const yy = String(now.getFullYear()).slice(2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      return `${yy}/${mm}/${dd}`;
    })(),
    weight: '',
    bmi: '',
    fat: '',
    muscle: '',
    bone: '',
    visceral: '',
    calories: '',
    age: ''
  });

  // 指標配置
  const metrics = [
    { key: 'weight', label: '體重 (kg)', color: '#3b82f6', icon: User, placeholder: '65.0' },
    { key: 'bmi', label: 'BMI 指數', color: '#6366f1', icon: Activity, placeholder: '21.0' },
    { key: 'fat', label: '體脂 (%)', color: '#f59e0b', icon: Info, placeholder: '17.0' },
    { key: 'muscle', label: '肌肉量 (kg)', color: '#ec4899', icon: Activity, placeholder: '50.0' },
    { key: 'bone', label: '推定骨量 (kg)', color: '#8b5cf6', icon: Database, placeholder: '2.8' },
    { key: 'visceral', label: '內臟脂肪', color: '#ef4444', icon: Heart, placeholder: '5' },
    { key: 'calories', label: '基礎代謝 (kcal)', color: '#10b981', icon: Flame, placeholder: '1500' },
    { key: 'age', label: '體內年齡', color: '#64748b', icon: Clock, placeholder: '35' },
  ];

  // 初始化 Google API
  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing Google API...');
        await initGoogleAPI();
        setIsGapiReady(true);

        const signedIn = isSignedIn();
        console.log('Sign-in status:', signedIn);
        setIsUserSignedIn(signedIn);

        if (signedIn) {
          console.log('User is signed in, loading data...');
          const user = await getCurrentUser();
          setCurrentUser(user);
          await loadData();
        } else {
          console.log('User is not signed in');
        }
      } catch (err) {
        console.error('Failed to initialize Google API:', err);
        setError('無法初始化 Google API');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // 載入數據
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await readSheetData();
      setRecords(data);
      
      // 用最後一筆記錄的值預填表單（日期除外）
      if (data.length > 0) {
        const lastRecord = data[data.length - 1];
        setFormData(prev => ({
          date: prev.date, // 保持今天的日期
          weight: lastRecord.weight?.toString() || '',
          bmi: lastRecord.bmi?.toString() || '',
          fat: lastRecord.fat?.toString() || '',
          muscle: lastRecord.muscle?.toString() || '',
          bone: lastRecord.bone?.toString() || '',
          visceral: lastRecord.visceral?.toString() || '',
          calories: lastRecord.calories?.toString() || '',
          age: lastRecord.age?.toString() || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('無法載入數據');
    } finally {
      setIsLoading(false);
    }
  };

  // 登入處理
  const handleSignIn = async () => {
    setError(null);
    const result = await signIn();
    if (result.success) {
      setIsUserSignedIn(true);
      const user = await getCurrentUser();
      setCurrentUser(user);
      await loadData();
    } else {
      setError(`登入失敗: ${result.error}`);
    }
  };

  // 登出處理
  const handleSignOut = async () => {
    signOut();
    setIsUserSignedIn(false);
    setCurrentUser(null);
    setRecords([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.weight) return;
    if (!isUserSignedIn) {
      setError('請先登入 Google 帳號');
      return;
    }

    const newRecord = {
      date: formData.date,
      weight: parseFloat(formData.weight) || 0,
      bmi: parseFloat(formData.bmi) || 0,
      fat: parseFloat(formData.fat) || 0,
      muscle: parseFloat(formData.muscle) || 0,
      bone: parseFloat(formData.bone) || 0,
      visceral: parseFloat(formData.visceral) || 0,
      calories: parseFloat(formData.calories) || 0,
      age: parseInt(formData.age) || 0
    };

    setIsSaving(true);
    setError(null);
    
    try {
      await appendSheetData(newRecord);
      setRecords([...records, newRecord]);
      // 保留輸入值，只更新日期為今天（方便連續輸入，下次只需微調數值）
      // 不清空數據，因為通常每天的數據變化不大
    } catch (err) {
      console.error('Failed to save record:', err);
      setError('儲存失敗，請重試');
    } finally {
      setIsSaving(false);
    }
  };

  const ChartSection = ({ metric }) => {
    const Icon = metric.icon;
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}15` }}>
            <Icon className="w-5 h-5" style={{ color: metric.color }} />
          </div>
          <h3 className="font-bold text-slate-800">{metric.label} </h3>
        </div>
        <div className="h-64 w-full">
          {records.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={records}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  width={35}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey={metric.key} 
                  name={metric.label} 
                  stroke={metric.color} 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: metric.color, strokeWidth: 2 }} 
                  activeDot={{ r: 5, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              {isUserSignedIn ? '尚無數據' : '請先登入以查看數據'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">inBody</h1>

          </div>
          <div className="flex items-center gap-3">
            {/* 記錄數 */}
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center text-sm text-slate-600 shadow-sm">
              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
              總記錄數：{records.length} 筆
            </div>
            
            {/* 登入狀態 & 按鈕 */}
            {isGapiReady && (
              isUserSignedIn ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadData}
                    disabled={isLoading}
                    className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                    title="重新載入"
                  >
                    <RefreshCw className={`w-5 h-5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">登出</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-lg"
                >
                  <LogIn className="w-4 h-4" />
                  使用 Google 登入
                </button>
              )
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {!isGapiReady ? '正在初始化...' : isUserSignedIn ? '載入數據中...' : '檢查登入狀態...'}
          </div>
        )}

        {/* Input Form Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <PlusCircle className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold text-slate-800">新增測量紀錄</h2>
          </div>
          <form onSubmit={handleAddRecord} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500">日期</label>
              <input 
                type="text" name="date" value={formData.date} onChange={handleInputChange}
                placeholder="26/01/24" className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            {metrics.map(m => (
              <div key={m.key} className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-slate-500">{m.label.split(' ')[0]}</label>
                <input 
                  type="number" step="0.01" inputMode="decimal" name={m.key} value={formData[m.key]} onChange={handleInputChange}
                  placeholder={m.placeholder} className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ))}
            <div className="flex items-end lg:col-span-8 justify-end mt-2">
              <button 
                type="submit"
                disabled={!isUserSignedIn || isSaving}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>儲存中...</span>
                  </>
                ) : (
                  <span>新增紀錄</span>
                )}
              </button>
            </div>
          </form>
          {!isUserSignedIn && (
            <p className="mt-4 text-sm text-amber-600 flex items-center gap-2">
              <Info className="w-4 h-4" />
              請先登入 Google 帳號才能新增紀錄
            </p>
          )}
        </div>

        {/* Individual Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((m) => (
            <ChartSection key={m.key} metric={m} />
          ))}
        </div>

        {/* History Table (Mini) */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm">最近 14 筆紀錄</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3">日期</th>
                  <th className="px-6 py-3">體重</th>
                  <th className="px-6 py-3">BMI</th>
                  <th className="px-6 py-3">體脂%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {records.length > 0 ? (
                  records.slice(-14).reverse().map((r, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3 font-medium text-slate-900">{r.date}</td>
                      <td className="px-6 py-3">{r.weight} kg</td>
                      <td className="px-6 py-3">{r.bmi}</td>
                      <td className="px-6 py-3">{r.fat}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-slate-400">
                      {isUserSignedIn ? '尚無紀錄' : '請先登入以查看紀錄'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <div>數據來源：Google Sheets</div>
          <div className="mt-1">建置時間：{__BUILD_TIME__}</div>
        </div>
      </div>
    </div>
  );
};

export default App;
