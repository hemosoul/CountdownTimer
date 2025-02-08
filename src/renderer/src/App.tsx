import { useState, useEffect } from 'react'

function App(): JSX.Element {
  const [count, setCount] = useState(60)
  const [bgColor, setBgColor] = useState('#ffffff')

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => (prev > 0 ? prev - 1 : 60))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const changeBackground = () => {
    const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`
    setBgColor(randomColor)
  }

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100vh', padding: '20px' }}>
      <div className="text">
        <h1>倒计时: {count} 秒</h1>
        <button onClick={changeBackground} style={{ padding: '10px 20px', marginTop: '20px' }}>
          更换背景颜色
        </button>
      </div>
    </div>
  )
}

export default App
