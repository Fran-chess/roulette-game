// [modificación] Este archivo solo actúa como un puente hacia el cliente
'use client';
import ClientWrapper from './ClientWrapper';
import { use } from 'react';

// [modificación] Actualizamos para usar React.use() como recomienda Next.js
export default function RegisterPage({ 
  params 
}: { 
  params: { sessionId: string } | Promise<{ sessionId: string }> 
}) {
  // [modificación] Usamos React.use para desenvolver los params si son una promesa
  const resolvedParams = params instanceof Promise ? use(params) : params;
  return <ClientWrapper sessionId={resolvedParams.sessionId} />;
} 