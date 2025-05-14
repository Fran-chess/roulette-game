'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';

interface AdminPlayerFormProps {
  sessionId: string;
  onPlayerRegistered?: () => void;
}

const AdminPlayerForm: React.FC<AdminPlayerFormProps> = ({ sessionId, onPlayerRegistered }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    especialidad: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/sessions/register-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar jugador');
      }

      setSuccess('Jugador registrado correctamente');
      // Limpiar el formulario
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        especialidad: '',
      });
      
      if (onPlayerRegistered) {
        onPlayerRegistered();
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar jugador');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-transparent rounded-lg">
      {success && (
        <div className="bg-slate-900/20 border border-white/20 text-white p-4 mb-4 rounded-lg" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-slate-900/20 border border-white/20 text-white p-4 mb-4 rounded-lg" role="alert">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-white/80 mb-1">
              Nombre <span className="text-white">*</span>
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-900/20 border border-white/20 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white/40 placeholder-white/50"
              required
            />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium text-white/80 mb-1">
              Apellido
            </label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-900/20 border border-white/20 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white/40 placeholder-white/50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
            Email <span className="text-white">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-900/20 border border-white/20 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white/40 placeholder-white/50"
            required
          />
        </div>

        <div>
          <label htmlFor="especialidad" className="block text-sm font-medium text-white/80 mb-1">
            Especialidad
          </label>
          <input
            type="text"
            id="especialidad"
            name="especialidad"
            value={formData.especialidad}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-900/20 border border-white/20 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white/40 placeholder-white/50"
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            variant="custom"
            className="w-full bg-slate-900/30 hover:bg-slate-900/50 text-white font-marineBold py-2.5 px-5 rounded-lg shadow-md border border-white/20 transition-colors duration-300"
            disabled={isLoading}
          >
            {isLoading ? 'Registrando...' : 'Registrar Jugador'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminPlayerForm; 