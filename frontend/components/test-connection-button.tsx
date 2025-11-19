'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface TestConnectionButtonProps {
  onTest: () => Promise<{ success: boolean; message: string }>
  label?: string
}

export function TestConnectionButton({ onTest, label = 'Tester la connexion' }: TestConnectionButtonProps) {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleTest = async () => {
    setStatus('testing')
    setMessage('')
    
    try {
      const result = await onTest()
      setStatus(result.success ? 'success' : 'error')
      setMessage(result.message)
      
      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    } catch (error) {
      setStatus('error')
      setMessage('Erreur lors du test de connexion')
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleTest}
        disabled={status === 'testing'}
      >
        {status === 'testing' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {status === 'success' && <CheckCircle2 className="w-4 h-4 mr-2 text-success" />}
        {status === 'error' && <XCircle className="w-4 h-4 mr-2 text-destructive" />}
        {label}
      </Button>
      
      {message && (
        <div className={`text-sm p-3 rounded-lg ${
          status === 'success' 
            ? 'bg-success/10 text-success border border-success/20' 
            : 'bg-destructive/10 text-destructive border border-destructive/20'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
