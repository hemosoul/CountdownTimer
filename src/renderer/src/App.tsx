import { useState, useEffect } from 'react'
import './assets/main.css'

function App(): JSX.Element {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [isRunning, setIsRunning] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [bgColor, setBgColor] = useState('#1a1a1a')

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

  return (
    <div className="app-container" style={{ backgroundColor: bgColor }}>
      <div className="timer-display">
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
        <button onClick={changeBackground}>更换背景</button>
      </div>
    </div>
  )
}

export default App
