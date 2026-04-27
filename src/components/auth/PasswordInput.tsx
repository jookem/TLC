import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string
}

export function PasswordInput({ id, className, ...props }: Props) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className={`h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 pr-10 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className ?? ''}`}
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
