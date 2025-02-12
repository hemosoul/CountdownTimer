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
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const [isMaximized, setIsMaximized] = useState(false)

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

  useEffect(() => {
    const savedPos = localStorage.getItem('timerPosition');
    if (savedPos) setPosition(JSON.parse(savedPos));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    localStorage.setItem('timerPosition', JSON.stringify(position));
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
    // 新增位置重置逻辑
    setPosition({ x: 0, y: 0 })
    localStorage.removeItem('timerPosition')
    
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

  const minimizeWindow = () => window.electron.ipcRenderer.send('minimize-window')
  const closeWindow = () => window.electron.ipcRenderer.send('close-window')

  return (
    <div className={`app-container ${isFlashing ? 'pre-flashing' : ''} ${endFlashing ? 'end-flashing' : ''}`} 
      style={{ 
        backgroundColor: bgColor,
        backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      <div className="custom-titlebar" onDoubleClick={toggleFullscreen}>
        <div className="drag-region">
          <span className="app-title">{settings.title || '全屏倒计时器'}</span>
        </div>
        <div className="window-controls">
          <button className="control-button" onClick={minimizeWindow}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path fill="currentColor" d="M11 5.5H1v1h10v-1z"/>
            </svg>
          </button>
          <button className="control-button" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M9.00002 3.99998H4.00004L4 9M20 8.99999V4L15 3.99997M15 20H20L20 15M4 15L4 20L9.00002 20" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
            ) : (
              <svg fill="#ffffff" height="12px" width="12px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"viewBox="0 0 492.308 492.308" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M114.279,0v114.274H0v378.034h378.039V378.029h114.269V0H114.279z M358.346,472.615H19.692V133.966h338.654V472.615z M472.615,358.337h-94.577V114.274H133.971V19.692h338.644V358.337z"></path> </g> </g> </g></svg>
            )}
          </button>
          <button className="control-button close" onClick={closeWindow}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path fill="currentColor" d="M11 1.5L10.5 1 6 5.5 1.5 1 1 1.5 5.5 6 1 10.5l.5.5L6 6.5l4.5 4.5.5-.5L6.5 6z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="title-header">
        {settings.title}
      </div>
      <div className="current-date">
        {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div 
        className="timer-display"
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isRunning ? (
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            ) : (
              <path d="M5 3l14 9-14 9V3z"/>
            )}
          </svg>
          {isRunning ? '暂停' : '开始'}
        </button>
        <button className="btn-icon-text" onClick={resetTimer}>
          <svg fill="#ffffff" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M960 0v112.941c467.125 0 847.059 379.934 847.059 847.059 0 467.125-379.934 847.059-847.059 847.059-467.125 0-847.059-379.934-847.059-847.059 0-267.106 126.607-515.915 338.824-675.727v393.374h112.94V112.941H0v112.941h342.89C127.058 407.38 0 674.711 0 960c0 529.355 430.645 960 960 960s960-430.645 960-960S1489.355 0 960 0" fill-rule="evenodd"></path> </g></svg>
          重置
        </button>  
        <button className="btn-icon-text" onClick={setting}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M9.75195 12.0128C9.75175 11.0587 10.4087 10.2372 11.3211 10.0509C12.2335 9.86458 13.1472 10.3652 13.5034 11.2467C13.8595 12.1282 13.559 13.1449 12.7856 13.6752C12.0121 14.2054 10.9812 14.1014 10.3233 13.4268C9.95757 13.0518 9.75206 12.5432 9.75195 12.0128Z" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M10.3077 5.46781C10.2943 4.94809 10.557 4.46185 10.9937 4.19793C11.4305 3.93402 11.9725 3.93402 12.4092 4.19793C12.8459 4.46185 13.1086 4.94809 13.0952 5.46781V6.18481C14.1532 6.45066 15.1177 7.01454 15.8798 7.81281L16.4346 7.47881C16.7552 7.28632 17.1379 7.23446 17.4962 7.33495C17.8545 7.43544 18.1583 7.6798 18.3388 8.01281C18.7238 8.70718 18.4973 9.58984 17.8288 9.99981L17.3121 10.3108C17.6296 11.4207 17.6296 12.6009 17.3121 13.7108L17.8288 14.0218C18.4996 14.4319 18.7264 15.3175 18.3388 16.0128C18.1579 16.3455 17.8541 16.5894 17.4958 16.6895C17.1375 16.7896 16.7549 16.7375 16.4346 16.5448L15.8798 16.2108C15.1177 17.01 14.1528 17.5746 13.0942 17.8408V18.5578C13.1076 19.0775 12.845 19.5638 12.4082 19.8277C11.9715 20.0916 11.4295 20.0916 10.9927 19.8277C10.556 19.5638 10.2933 19.0775 10.3067 18.5578V17.8408C9.24871 17.575 8.28422 17.0111 7.52212 16.2128L6.96735 16.5468C6.64684 16.739 6.26438 16.7907 5.90629 16.6902C5.5482 16.5897 5.24464 16.3455 5.06415 16.0128C4.67911 15.3184 4.90563 14.4358 5.57407 14.0258L6.09082 13.7148C5.77329 12.6049 5.77329 11.4247 6.09082 10.3148L5.57407 10.0038C4.90333 9.59369 4.67651 8.70808 5.06415 8.01281C5.24498 7.68014 5.54885 7.43621 5.90715 7.3361C6.26546 7.236 6.64797 7.28816 6.96832 7.48081L7.5231 7.81481C8.28484 7.01545 9.24936 6.4505 10.3077 6.18381V5.46781Z" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
          设置
        </button>
        <button className="btn-icon-text" onClick={toggleFullscreen}>
     
            {isFullscreen ? (
              <svg fill="#ffffff" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M391 240.9c-.8-6.6-8.9-9.4-13.6-4.7l-43.7 43.7L200 146.3a8.03 8.03 0 0 0-11.3 0l-42.4 42.3a8.03 8.03 0 0 0 0 11.3L280 333.6l-43.9 43.9a8.01 8.01 0 0 0 4.7 13.6L401 410c5.1.6 9.5-3.7 8.9-8.9L391 240.9zm10.1 373.2L240.8 633c-6.6.8-9.4 8.9-4.7 13.6l43.9 43.9L146.3 824a8.03 8.03 0 0 0 0 11.3l42.4 42.3c3.1 3.1 8.2 3.1 11.3 0L333.7 744l43.7 43.7A8.01 8.01 0 0 0 391 783l18.9-160.1c.6-5.1-3.7-9.4-8.8-8.8zm221.8-204.2L783.2 391c6.6-.8 9.4-8.9 4.7-13.6L744 333.6 877.7 200c3.1-3.1 3.1-8.2 0-11.3l-42.4-42.3a8.03 8.03 0 0 0-11.3 0L690.3 279.9l-43.7-43.7a8.01 8.01 0 0 0-13.6 4.7L614.1 401c-.6 5.2 3.7 9.5 8.8 8.9zM744 690.4l43.9-43.9a8.01 8.01 0 0 0-4.7-13.6L623 614c-5.1-.6-9.5 3.7-8.9 8.9L633 783.1c.8 6.6 8.9 9.4 13.6 4.7l43.7-43.7L824 877.7c3.1 3.1 8.2 3.1 11.3 0l42.4-42.3c3.1-3.1 3.1-8.2 0-11.3L744 690.4z"></path> </g></svg>
              ) : (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M9.00002 3.99997H4.00004L4 8.99999M20 8.99999V4L15 3.99997M15 20H20L20 15M4 15L4 20L9.00002 20" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>   
            )}
          
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
