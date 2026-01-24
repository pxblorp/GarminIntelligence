import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Activity, Heart, Moon, TrendingUp } from 'lucide-react';

const TrainingLoadDashboard = () => {
  const [activities, setActivities] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeChart, setActiveChart] = useState('training'); // 'training' or 'vitals'
  const [backendUrl, setBackendUrl] = useState('https://garminintelligence-production.up.railway.app');
  const [showSettings, setShowSettings] = useState(false);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
    loadBackendUrl();
  }, []);

  const loadBackendUrl = async () => {
    try {
      const urlData = await window.storage.get('backend-url');
      if (urlData) {
        setBackendUrl(urlData.value);
      }
    } catch (error) {
      console.log('No backend URL saved');
    }
  };

  const saveBackendUrl = async (url) => {
    try {
      await window.storage.set('backend-url', url);
      setBackendUrl(url);
    } catch (error) {
      console.error('Error saving backend URL:', error);
    }
  };

  const loadData = async () => {
    try {
      const activitiesData = await window.storage.get('training-activities');
      const vitalsData = await window.storage.get('health-vitals');
      
      if (activitiesData) {
        setActivities(JSON.parse(activitiesData.value));
      }
      if (vitalsData) {
        setVitals(JSON.parse(vitalsData.value));
      }
    } catch (error) {
      console.log('No existing data found, starting fresh');
    }
  };

  const saveData = async (newActivities, newVitals) => {
    try {
      await window.storage.set('training-activities', JSON.stringify(newActivities));
      await window.storage.set('health-vitals', JSON.stringify(newVitals));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Function to connect to Garmin API via Python backend
  const fetchGarminData = async () => {
    try {
      // Change this URL to match your backend server
      const BACKEND_URL = 'http://garminintelligence-production.up.railway.app';
      
      // Show loading state (you could add a loading spinner here)
      console.log('Syncing with Garmin...');
      
      const response = await fetch(`${BACKEND_URL}/api/sync?days=60`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data from Garmin');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Filter out activities and vitals with null values
        const validActivities = data.activities.filter(a => a.trainingLoad && a.duration);
        const validVitals = data.vitals.filter(v => v.sleepScore || v.restingHR || v.hrv);
        
        setActivities(validActivities);
        setVitals(validVitals);
        saveData(validActivities, validVitals);
        
        alert(`Successfully synced ${validActivities.length} activities and ${validVitals.length} days of vitals!`);
      } else {
        throw new Error(data.message || 'Sync failed');
      }
      
    } catch (error) {
      console.error('Error syncing Garmin data:', error);
      alert(`Failed to sync with Garmin: ${error.message}. Using sample data instead.`);
      
      // Fallback to sample data if sync fails
      const sampleActivities = generateSampleActivities();
      const sampleVitals = generateSampleVitals();
      
      setActivities(sampleActivities);
      setVitals(sampleVitals);
      saveData(sampleActivities, sampleVitals);
    }
  };

  // Generate sample data for demonstration
  const generateSampleActivities = () => {
    const activities = [];
    const today = new Date();
    
    for (let i = 60; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      if (Math.random() > 0.3) { // 70% chance of activity
        const duration = Math.floor(Math.random() * 90) + 30;
        const rpe = Math.floor(Math.random() * 6) + 4;
        const trainingLoad = Math.floor(Math.random() * 150) + 50;
        
        activities.push({
          date: date.toISOString().split('T')[0],
          duration,
          rpe,
          trainingLoad,
          tRPE: duration * rpe,
          activityType: ['Run', 'Bike', 'Swim'][Math.floor(Math.random() * 3)]
        });
      }
    }
    
    return activities;
  };

  const generateSampleVitals = () => {
    const vitals = [];
    const today = new Date();
    
    for (let i = 60; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      vitals.push({
        date: date.toISOString().split('T')[0],
        sleepScore: Math.floor(Math.random() * 30) + 70,
        restingHR: Math.floor(Math.random() * 15) + 50,
        sleepingHR: Math.floor(Math.random() * 10) + 45,
        hrv: Math.floor(Math.random() * 40) + 40,
        stress: Math.floor(Math.random() * 60) + 20
      });
    }
    
    return vitals;
  };

  // Calculate 4-week rolling average
  const calculate4WeekAverage = (data, field) => {
    return data.map((item, index) => {
      const startIndex = Math.max(0, index - 27);
      const subset = data.slice(startIndex, index + 1);
      const avg = subset.reduce((sum, d) => sum + (d[field] || 0), 0) / subset.length;
      return {
        ...item,
        [`${field}Avg`]: Math.round(avg * 10) / 10
      };
    });
  };

  // Prepare chart data
  const getTrainingChartData = () => {
    const withAverages = calculate4WeekAverage(
      calculate4WeekAverage(activities, 'tRPE'),
      'trainingLoad'
    );
    return withAverages;
  };

  const getVitalsChartData = () => {
    return vitals;
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getActivityForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return activities.find(a => a.date === dateStr);
  };

  const getVitalsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return vitals.find(v => v.date === dateStr);
  };

  const getLoadColor = (trainingLoad) => {
    if (!trainingLoad) return 'bg-gray-100';
    if (trainingLoad < 75) return 'bg-green-200';
    if (trainingLoad < 125) return 'bg-yellow-200';
    if (trainingLoad < 175) return 'bg-orange-200';
    return 'bg-red-200';
  };

  const getSleepColor = (sleepScore) => {
    if (!sleepScore) return 'bg-gray-100';
    if (sleepScore >= 85) return 'bg-green-200';
    if (sleepScore >= 70) return 'bg-yellow-200';
    if (sleepScore >= 60) return 'bg-orange-200';
    return 'bg-red-200';
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const activity = getActivityForDate(date);
      const vital = getVitalsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      
      days.push(
        <div
          key={day}
          className={`aspect-square p-1 border cursor-pointer ${getSleepColor(vital?.sleepScore)} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="text-xs font-semibold">{day}</div>
          {activity && (
            <div className={`text-xs mt-0.5 p-0.5 rounded ${getLoadColor(activity.trainingLoad)}`}>
              <div className="font-semibold">{activity.activityType}</div>
              <div>TL: {activity.trainingLoad}</div>
            </div>
          )}
          {vital && (
            <div className="text-xs mt-0.5">
              <div className="flex items-center gap-0.5">
                <Moon size={10} />
                <span>{vital.sleepScore}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Heart size={10} />
                <span>{vital.restingHR}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const trainingChartData = getTrainingChartData();
  const vitalsChartData = getVitalsChartData();
  const latestVitals = vitals[vitals.length - 1] || {};

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="text-blue-600" />
              Training Load Dashboard
            </h1>
            <button
              onClick={fetchGarminData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Sync Garmin Data
            </button>
          </div>

          {/* Health Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Moon size={20} />
                <span className="font-semibold">Sleep Score</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{latestVitals.sleepScore || '--'}</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <Heart size={20} />
                <span className="font-semibold">Resting HR</span>
              </div>
              <div className="text-3xl font-bold text-red-900">{latestVitals.restingHR || '--'}</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 mb-2">
                <Moon size={20} />
                <span className="font-semibold">Sleeping HR</span>
              </div>
              <div className="text-3xl font-bold text-purple-900">{latestVitals.sleepingHR || '--'}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <TrendingUp size={20} />
                <span className="font-semibold">HRV</span>
              </div>
              <div className="text-3xl font-bold text-green-900">{latestVitals.hrv || '--'}</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 mb-2">
                <Activity size={20} />
                <span className="font-semibold">Stress</span>
              </div>
              <div className="text-3xl font-bold text-orange-900">{latestVitals.stress || '--'}</div>
            </div>
          </div>

          {/* Chart Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveChart('training')}
              className={`px-4 py-2 rounded-lg transition ${
                activeChart === 'training'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Training Metrics
            </button>
            <button
              onClick={() => setActiveChart('vitals')}
              className={`px-4 py-2 rounded-lg transition ${
                activeChart === 'vitals'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Health Vitals
            </button>
          </div>

          {/* Charts */}
          {activeChart === 'training' ? (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Training Load & t*RPE</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trainingChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="trainingLoad" stroke="#3b82f6" name="Training Load" strokeWidth={2} />
                  <Line type="monotone" dataKey="trainingLoadAvg" stroke="#93c5fd" name="4-Week Avg TL" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="tRPE" stroke="#ef4444" name="t*RPE" strokeWidth={2} />
                  <Line type="monotone" dataKey="tRPEAvg" stroke="#fca5a5" name="4-Week Avg t*RPE" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Health Vitals Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={vitalsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sleepScore" stroke="#3b82f6" name="Sleep Score" strokeWidth={2} />
                  <Line type="monotone" dataKey="restingHR" stroke="#ef4444" name="Resting HR" strokeWidth={2} />
                  <Line type="monotone" dataKey="sleepingHR" stroke="#a855f7" name="Sleeping HR" strokeWidth={2} />
                  <Line type="monotone" dataKey="hrv" stroke="#22c55e" name="HRV" strokeWidth={2} />
                  <Line type="monotone" dataKey="stress" stroke="#f97316" name="Stress" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Calendar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar size={24} />
                Activity & Vitals Calendar
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  ←
                </button>
                <span className="px-4 py-1 font-semibold">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  →
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-sm text-gray-600">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
            
            <div className="mt-4">
              <div className="font-semibold mb-2 text-sm">Background Color - Sleep Score:</div>
              <div className="flex gap-4 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 border"></div>
                  <span>Excellent (≥85)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 border"></div>
                  <span>Good (70-84)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-200 border"></div>
                  <span>Fair (60-69)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 border"></div>
                  <span>Poor (&lt;60)</span>
                </div>
              </div>
              <div className="font-semibold mb-2 text-sm">Activity Badge - Training Load:</div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 border"></div>
                  <span>Light (&lt;75)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 border"></div>
                  <span>Moderate (75-125)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-200 border"></div>
                  <span>Heavy (125-175)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 border"></div>
                  <span>Very Heavy (&gt;175)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              
              {getActivityForDate(selectedDate) && (
                <div className="mb-4">
                  <h4 className="font-semibold text-md mb-2">Activity</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Type</div>
                      <div className="font-semibold">{getActivityForDate(selectedDate).activityType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-semibold">{getActivityForDate(selectedDate).duration} min</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">RPE</div>
                      <div className="font-semibold">{getActivityForDate(selectedDate).rpe}/10</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">t*RPE</div>
                      <div className="font-semibold">{getActivityForDate(selectedDate).tRPE}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Training Load</div>
                      <div className="font-semibold">{getActivityForDate(selectedDate).trainingLoad}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {getVitalsForDate(selectedDate) && (
                <div>
                  <h4 className="font-semibold text-md mb-2">Health Vitals</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Sleep Score</div>
                      <div className="font-semibold">{getVitalsForDate(selectedDate).sleepScore}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Resting HR</div>
                      <div className="font-semibold">{getVitalsForDate(selectedDate).restingHR} bpm</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Sleeping HR</div>
                      <div className="font-semibold">{getVitalsForDate(selectedDate).sleepingHR} bpm</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">HRV</div>
                      <div className="font-semibold">{getVitalsForDate(selectedDate).hrv} ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Stress</div>
                      <div className="font-semibold">{getVitalsForDate(selectedDate).stress}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {!getActivityForDate(selectedDate) && !getVitalsForDate(selectedDate) && (
                <p className="text-gray-600">No data recorded for this day.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingLoadDashboard;
