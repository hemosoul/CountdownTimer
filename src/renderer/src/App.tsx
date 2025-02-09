import { useState, useEffect } from 'react'
import './assets/main.css'

interface Settings {
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
  const [settings, setSettings] = useState<Settings>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    reminderMinutes: 5,
    backgroundImage: null
  })

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds(prev => prev - 1)
        setTime(secondsToTime(totalSeconds - 1))
      }, 1000)
    } else if (totalSeconds === 0) {
      setIsRunning(false)
      // 添加提醒逻辑
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, totalSeconds])

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
    setTotalSeconds(0)
    setTime({ hours: 0, minutes: 0, seconds: 0 })
  }

  const changeBackground = () => {
    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`
    setBgColor(randomColor)
  }

  const setting = () => {
    setIsDrawerOpen(true)
  }

  const saveSettings = () => {
    const totalSeconds = settings.hours * 3600 + settings.minutes * 60 + settings.seconds
    setTotalSeconds(totalSeconds)
    setIsDrawerOpen(false)
    // 保存设置到本地
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

  return (
    <div className="app-container" style={{ 
      backgroundColor: bgColor,
      backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined
    }}>
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
        <button onClick={startTimer}>开始</button>
        <button onClick={pauseTimer}>暂停</button>
        <button onClick={resetTimer}>重置</button>  
        <button onClick={setting}>设置</button>
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
            /> 分钟
          </div>



          <div className="setting-group">
            <button onClick={changeBackground}>更换背景</button>
          </div>



          <div className="setting-group">
            <label>背景图片</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundImageChange}
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
