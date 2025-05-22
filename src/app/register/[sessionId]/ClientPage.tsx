'use client';
import ClientWrapper from './ClientWrapper';

// [modificación] Componente cliente que recibe la sessionId directamente
export default function ClientRegisterPage({ 
  sessionId 
}: { 
  sessionId: string 
}) {
  return <ClientWrapper sessionId={sessionId} />;
} 