"use client"

import { useEffect, useRef, useState, useCallback } from "react"

const GRID_SIZE = 20
const CANVAS_SIZE = 400

interface Position {
  x: number
  y: number
}

interface GameState {
  snake: Position[]
  food: Position
  direction: Position
  gameOver: boolean
  score: number
  highScore: number
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: { x: 0, y: 0 },
    gameOver: false,
    score: 0,
    highScore: 0,
  })
  const [isPlaying, setIsPlaying] = useState(false)

  // 랜덤 음식 위치 생성
  const generateFood = useCallback((snake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  // 게임 초기화
  const initGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }]
    const savedHighScore = localStorage.getItem("snakeHighScore")
    setGameState({
      snake: initialSnake,
      food: generateFood(initialSnake),
      direction: { x: 0, y: 0 },
      gameOver: false,
      score: 0,
      highScore: savedHighScore ? Number.parseInt(savedHighScore) : 0,
    })
    setIsPlaying(false)
  }, [generateFood])

  // 게임 시작
  const startGame = () => {
    setIsPlaying(true)
    setGameState((prev) => ({ ...prev, direction: { x: 1, y: 0 } }))
  }

  // 게임 재시작
  const restartGame = () => {
    initGame()
    startGame()
  }

  // 키보드 이벤트 처리
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!isPlaying || gameState.gameOver) return

      setGameState((prev) => {
        const { direction } = prev
        switch (e.key) {
          case "ArrowUp":
            if (direction.y !== 1) return { ...prev, direction: { x: 0, y: -1 } }
            break
          case "ArrowDown":
            if (direction.y !== -1) return { ...prev, direction: { x: 0, y: 1 } }
            break
          case "ArrowLeft":
            if (direction.x !== 1) return { ...prev, direction: { x: -1, y: 0 } }
            break
          case "ArrowRight":
            if (direction.x !== -1) return { ...prev, direction: { x: 1, y: 0 } }
            break
        }
        return prev
      })
    },
    [isPlaying, gameState.gameOver],
  )

  // 게임 루프
  const gameLoop = useCallback(() => {
    if (!isPlaying || gameState.gameOver) return

    setGameState((prev) => {
      const { snake, food, direction, score } = prev

      if (direction.x === 0 && direction.y === 0) return prev

      const head = { ...snake[0] }
      head.x += direction.x
      head.y += direction.y

      // 벽 충돌 검사
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        const newHighScore = Math.max(score, prev.highScore)
        localStorage.setItem("snakeHighScore", newHighScore.toString())
        return { ...prev, gameOver: true, highScore: newHighScore }
      }

      // 자기 몸 충돌 검사
      if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        const newHighScore = Math.max(score, prev.highScore)
        localStorage.setItem("snakeHighScore", newHighScore.toString())
        return { ...prev, gameOver: true, highScore: newHighScore }
      }

      const newSnake = [head, ...snake]

      // 음식 먹기 검사
      if (head.x === food.x && head.y === food.y) {
        return {
          ...prev,
          snake: newSnake,
          food: generateFood(newSnake),
          score: score + 1,
        }
      } else {
        newSnake.pop()
        return { ...prev, snake: newSnake }
      }
    })
  }, [isPlaying, gameState.gameOver, generateFood])

  // 게임 렌더링
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 배경 그리기
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // 격자 그리기
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = (i * CANVAS_SIZE) / GRID_SIZE
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, CANVAS_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(CANVAS_SIZE, pos)
      ctx.stroke()
    }

    const cellSize = CANVAS_SIZE / GRID_SIZE

    // 뱀 그리기 (초록색)
    gameState.snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "#22c55e" : "#16a34a" // 머리는 더 밝은 초록색
      ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2)
    })

    // 사과 그리기 (빨간색)
    const { food } = gameState
    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, cellSize / 2 - 2, 0, 2 * Math.PI)
    ctx.fill()

    // 사과 줄기 그리기
    ctx.fillStyle = "#22c55e"
    ctx.fillRect(food.x * cellSize + cellSize / 2 - 1, food.y * cellSize + 2, 2, 4)
  }, [gameState])

  // 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  // 게임 루프 실행
  useEffect(() => {
    const interval = setInterval(gameLoop, 200) // 게임 속도를 150ms에서 200ms로 변경하여 1/3 느리게 만듦
    return () => clearInterval(interval)
  }, [gameLoop])

  // 렌더링
  useEffect(() => {
    draw()
  }, [draw])

  // 초기화
  useEffect(() => {
    initGame()
  }, [initGame])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2 text-green-400">Snake Game</h1>
        <p className="text-gray-300">방향키로 뱀을 조종하여 빨간 사과를 먹어보세요!</p>
      </div>

      <div className="flex gap-8 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{gameState.score}</div>
          <div className="text-sm text-gray-400">점수</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{gameState.highScore}</div>
          <div className="text-sm text-gray-400">최고점</div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border-2 border-gray-600 rounded-lg"
        />

        {!isPlaying && !gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
            <div className="text-center">
              <button
                onClick={startGame}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg transition-colors"
              >
                게임 시작
              </button>
              <p className="mt-2 text-sm text-gray-300">방향키로 조작하세요</p>
            </div>
          </div>
        )}

        {gameState.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 text-red-400">게임 오버!</h2>
              <p className="mb-4 text-gray-300">점수: {gameState.score}</p>
              <button
                onClick={restartGame}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-colors"
              >
                다시 시작
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-sm text-gray-400 max-w-md">
        <p className="mb-2">
          🎮 <strong>조작법:</strong> 방향키 (↑↓←→)
        </p>
        <p className="mb-2">🍎 빨간 사과를 먹으면 뱀이 길어지고 점수가 올라갑니다</p>
        <p>💀 벽이나 자신의 몸에 부딪히면 게임이 끝납니다</p>
      </div>
    </div>
  )
}
