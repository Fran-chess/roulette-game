// [modificación] Componente servidor que maneja los parámetros
import ClientRegisterPage from './ClientPage';

// [modificación] Componente servidor que recibe los params como una Promise en Next.js 15
export default async function RegisterPage({ 
  params 
}: { 
  params: Promise<{ sessionId: string }> 
}) {
  // [modificación] Extraemos sessionId del objeto params
  const { sessionId } = await params;
  
  // [modificación] Pasamos la sessionId al componente cliente
  return <ClientRegisterPage sessionId={sessionId} />;
}

// [modificación] Agregamos las propiedades de generación estática para cumplir con Next.js 15
export const generateStaticParams = async () => {
  return [];
}; 