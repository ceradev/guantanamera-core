"use client"

import { Button } from "@/components/ui/buttons/button"
import { Delete, Space } from "lucide-react"

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void
  onDelete: () => void
  onSpace: () => void
}

const KEYS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
  ["Z", "X", "C", "V", "B", "N", "M"],
]

export function VirtualKeyboard({ onKeyPress, onDelete, onSpace }: VirtualKeyboardProps) {
  return (
    <div className="w-full bg-gray-100 p-3 rounded-t-2xl shadow-inner">
      <div className="flex flex-col gap-2 max-w-3xl mx-auto">
        {KEYS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map((key) => (
              <Button
                key={key}
                onClick={() => onKeyPress(key)}
                className="h-12 w-10 sm:w-14 text-lg font-bold bg-white text-black hover:bg-gray-200 shadow-sm"
                variant="ghost"
              >
                {key}
              </Button>
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-2 mt-1">
          <Button
            onClick={onSpace}
            className="h-12 flex-1 max-w-md text-base font-medium bg-white text-black hover:bg-gray-200 shadow-sm"
            variant="ghost"
          >
            <Space className="w-5 h-5 mr-2" />
            Espacio
          </Button>
          <Button
            onClick={onDelete}
            className="h-12 w-20 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 shadow-sm"
            variant="ghost"
          >
            <Delete className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
