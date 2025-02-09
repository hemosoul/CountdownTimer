import { useState, useEffect, useRef } from 'react'
import './assets/main.css'
import beepUrl from '../public/tip.mp3'
import endBeepUrl from '../public/timeup.mp3'


interface Settings {
  title: string
  hours: number
  minutes: number
  seconds: number
  reminderMinutes: number
  backgroundImage: string | null
}

function App(): JSX.Element {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [isRunning, setIsRunning] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [bgColor, setBgColor] = useState('#1a1a1a')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('timerSettings')
    if (savedSettings) {
      return JSON.parse(savedSettings)
    }
    // 默认值：15分钟倒计时，2分钟提醒
    const defaultSettings = {
      title: '',
      hours: 0,
      minutes: 15,
      seconds: 0,
      reminderMinutes: 2,
      backgroundImage: null
    }
    localStorage.setItem('timerSettings', JSON.stringify(defaultSettings))
    return defaultSettings
  })
  const [isFlashing, setIsFlashing] = useState(false)
  const [endFlashing, setEndFlashing] = useState(false)
  const [hasReminded, setHasReminded] = useState(false)
  const beepSound = useRef(new Audio(beepUrl)).current
  const endBeepSound = useRef(new Audio(endBeepUrl)).current
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const initialTotalSeconds = settings.hours * 3600 + settings.minutes * 60 + settings.seconds
    setTotalSeconds(initialTotalSeconds)
    setTime(secondsToTime(initialTotalSeconds))
  }, []) // 空依赖数组表示只在组件加载时执行

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    let endTimeout: NodeJS.Timeout | null = null
    
    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds(prev => {
          const newSeconds = prev - 1
          
          // 新增结束提醒逻辑
          if (newSeconds === 6) {
            setEndFlashing(true)
            endBeepSound.play().catch(e => console.error("结束提示音播放失败:", e));
            endTimeout = setTimeout(() => {
              setEndFlashing(false)
            }, 5000)
          }
          
          // 原有提前提醒逻辑
          const reminderSeconds = settings.reminderMinutes * 60
          if (newSeconds === reminderSeconds && !hasReminded) {
            
            setIsFlashing(true)
            setHasReminded(true)
            beepSound.play().catch(e => console.error("音频播放失败:", e));
            setTimeout(() => {
                setIsFlashing(false)
                beepSound.pause();
                beepSound.currentTime = 0;
            }, 3000)
          }
          
          return newSeconds
        })
        setTime(secondsToTime(totalSeconds - 1))
      }, 1000)
    } else if (totalSeconds === 0) {
      setIsRunning(false)
      setHasReminded(false)
    }

    return () => {
      if (interval) clearInterval(interval)
      if (endTimeout) clearTimeout(endTimeout)
    }
  }, [isRunning, totalSeconds, hasReminded, settings.reminderMinutes])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsToTime = (secs: number) => {
    const hours = Math.floor(secs / 3600)
    const minutes = Math.floor((secs % 3600) / 60)
    const seconds = secs % 60
    return { hours, minutes, seconds }
  }

  const startTimer = () => {
    if (totalSeconds > 0) {
      setIsRunning(true)
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    // 从本地存储重新加载设置
    const savedSettings = localStorage.getItem('timerSettings')
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      const initialTotalSeconds = parsedSettings.hours * 3600 + 
                                parsedSettings.minutes * 60 + 
                                parsedSettings.seconds
      setTotalSeconds(initialTotalSeconds)
      setTime(secondsToTime(initialTotalSeconds))
    }
    // 重置所有提醒状态
    setHasReminded(false)
    setIsFlashing(false)
    setEndFlashing(false)
  }

  const changeBackground = (color?: string) => {
    const selectedColor = color || `#${Math.floor(Math.random()*16777215).toString(16)}`
    setBgColor(selectedColor)
    // 选择纯色时清除背景图片
    setSettings(prev => ({...prev, backgroundImage: null}))
  }

  const setting = () => {
    setIsDrawerOpen(prev => !prev)
  }

  const saveSettings = () => {
    const totalSeconds = settings.hours * 3600 + settings.minutes * 60 + settings.seconds
    setTotalSeconds(totalSeconds)
    setTime(secondsToTime(totalSeconds))
    setIsDrawerOpen(false)
    localStorage.setItem('timerSettings', JSON.stringify(settings))
  }

  const handleBackgroundImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSettings(prev => ({...prev, backgroundImage: e.target?.result as string}))
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await window.electron.ipcRenderer.invoke('exit-fullscreen')
    } else {
      await window.electron.ipcRenderer.invoke('enter-fullscreen')
    }
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`app-container ${isFlashing ? 'pre-flashing' : ''} ${endFlashing ? 'end-flashing' : ''}`} 
      style={{ 
        backgroundColor: bgColor,
        backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      <div className="title-header">
        {settings.title}
      </div>
      <div className="current-date">
        {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div className="timer-display" onClick={() => setIsDrawerOpen(false)}>
        <div className="time-block">
          <span className="time-number">{String(time.hours).padStart(2, '0')}</span>
          <span className="time-label">小时</span>
        </div>
        <div className="time-block">
          <span className="time-number">{String(time.minutes).padStart(2, '0')}</span>
          <span className="time-label">分钟</span>
        </div>
        <div className="time-block">
          <span className="time-number">{String(time.seconds).padStart(2, '0')}</span>
          <span className="time-label">秒</span>
        </div>
      </div>
      <div className="controls">
        <button className="btn-icon-text" onClick={isRunning ? pauseTimer : startTimer}>
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isRunning ? (
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            ) : (
              <path d="M5 3l14 9-14 9V3z"/>
            )}
          </svg>
          {isRunning ? '暂停' : '开始'}
        </button>
        <button className="btn-icon-text" onClick={resetTimer}>
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 11A8.1 8.1 0 0 0 3.5 6M3 6v4h4m-4.6 7a8.1 8.1 0 0 0 16.5-5h0a8.1 8.1 0 0 0-3.9-6.5"/>
          </svg>
          重置
        </button>  
        <button className="btn-icon-text" onClick={setting}>
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.2 3a9 9 0 0 0-.9 2 7 7 0 0 1 5.9 5.9 9 9 0 0 0 2-.9 7 7 0 0 0-7 7 9 9 0 0 0 .9 2 7 7 0 0 1-5.9 5.9 9 9 0 0 0-2-.9 7 7 0 0 0-7 7 9 9 0 0 0 2 .9 7 7 0 0 1 5.9-5.9 9 9 0 0 0 2 .9 7 7 0 0 0 7-7 9 9 0 0 0-.9-2 7 7 0 0 1 5.9-5.9 9 9 0 0 0 .9 2 7 7 0 0 0-7-7z"/>
          </svg>
          设置
        </button>
        <button className="btn-icon-text" onClick={toggleFullscreen}>
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isFullscreen ? (
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            ) : (
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18-5v3a2 2 0 0 1-2 2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            )}
          </svg>
          {isFullscreen ? '退出全屏' : '全屏'}
        </button>
      </div>
      
      {/* Drawer Component */}
      <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-content">
          <h3>设置</h3>
          
          <div className="setting-group">
            <label>倒计时时间</label>
            <div className="time-inputs">
              <input
                type="number"
                min="0"
                value={settings.hours}
                onChange={(e) => setSettings({...settings, hours: +e.target.value})}
              /> 小时
              <input
                type="number"
                min="0"
                max="59"
                value={settings.minutes}
                onChange={(e) => setSettings({...settings, minutes: +e.target.value})}
              /> 分钟
              <input
                type="number"
                min="0"
                max="59"
                value={settings.seconds}
                onChange={(e) => setSettings({...settings, seconds: +e.target.value})}
              /> 秒
            </div>
          </div>

          <div className="setting-group">
            <label>提前提醒时间</label>
            <input
              type="number"
              min="1"
              value={settings.reminderMinutes}
              onChange={(e) => setSettings({...settings, reminderMinutes: +e.target.value})}
              className="reminder-input"
            /> 分钟
          </div>

          <div className="setting-group">
            <button onClick={() => changeBackground()}>随机颜色</button>
            <div className="color-palette">
              {['#1a1a1a', '#2d2d2d', '#383838', '#1e3a5f', '#234947', '#4a2c40'].map((color) => (
                <button
                  key={color}
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  onClick={() => changeBackground(color)}
                  title={`颜色值：${color}`}
                />
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label>背景图片</label>
            <div className="custom-file-input">
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundImageChange}
                id="background-upload"
                className="visually-hidden"
              />
              <label htmlFor="background-upload" className="upload-button">
                <span className="button-text">选择图片</span>
                <span className="file-name">{settings.backgroundImage ? '已选择' : '未选择'}</span>
              </label>
            </div>
          </div>

          <div className="setting-group">
            <label>标题设置</label>
            <input
              type="text"
              className="reminder-input"
              value={settings.title}
              onChange={(e) => setSettings({...settings, title: e.target.value})}
              placeholder="请输入标题"
            />
          </div>

          <button onClick={saveSettings}>保存</button>
          <button onClick={() => setIsDrawerOpen(false)}>关闭</button>
        </div>
      </div>
    </div>
  )
}

export default App
