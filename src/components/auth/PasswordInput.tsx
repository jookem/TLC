import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string
}

export function PasswordInput({ id, className, ...props }: Props) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        className={`pr-10 ${className ?? ''}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
