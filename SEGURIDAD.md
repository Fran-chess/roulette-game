# 🔒 Guía de Seguridad - Roulette Game

## ⚠️ Problema de Seguridad Resuelto

**Credenciales expuestas:** Se han identificado y corregido credenciales de Supabase expuestas en documentación pública.

### ✅ Acciones Tomadas

1. **Credenciales eliminadas** de todos los archivos de documentación
2. **Variables de ejemplo** implementadas en lugar de valores reales
3. **Archivo de configuración seguro** (`env.example`) creado
4. **Documentación actualizada** con mejores prácticas

---

## 🛡️ Mejores Prácticas de Seguridad

### 📂 Variables de Entorno

#### ✅ **Hacer:**
- Usar archivo `.env.local` para credenciales (está en `.gitignore`)
- Proporcionar archivo `env.example` con estructura sin valores reales
- Documentar claramente cómo obtener las credenciales
- Usar variables de ejemplo en documentación pública

#### ❌ **No hacer:**
- Nunca commits credenciales reales en código fuente
- No incluir URLs o claves reales en README o documentación
- No hardcodear credenciales en el código
- No compartir claves de servicio públicamente

### 🔑 Tipos de Credenciales

| Tipo | Descripción | Exposición | Uso |
|------|-------------|------------|-----|
| **NEXT_PUBLIC_SUPABASE_URL** | URL del proyecto | ✅ Pública | Cliente/Servidor |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | Clave anónima | ✅ Pública | Cliente (RLS protege) |
| **SUPABASE_SERVICE_ROLE_KEY** | Clave de servicio | ❌ **SECRETA** | Solo servidor |

### 📊 Configuración Actual de Seguridad

#### **Row Level Security (RLS)**
- ✅ **Habilitado** en tabla `admin_users`
- ✅ **Habilitado** en tabla `plays`
- ✅ **Políticas configuradas** por usuario
- ✅ **Acceso controlado** según roles

#### **Autenticación**
- ✅ **Passwords encriptados** con bcrypt
- ✅ **UUIDs seguros** para identificadores
- ✅ **Sesiones validadas** en cada request
- ✅ **Roles separados** (admin/viewer)

#### **Network Security**
- ✅ **HTTPS obligatorio** en producción
- ✅ **CORS configurado** en Supabase
- ✅ **Headers de seguridad** en Next.js
- ✅ **API keys restringidas** por dominio

---

## 🚀 Configuración Segura

### 1. **Crear Variables de Entorno**

```bash
# Copiar archivo de ejemplo
cp env.example .env.local

# Editar con tus credenciales reales
nano .env.local
```

### 2. **Obtener Credenciales de Supabase**

1. **Acceder al Dashboard:**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto

2. **Configurar URL:**
   - Settings → API → Project URL
   - Copia: `https://[tu-id-proyecto].supabase.co`

3. **Configurar Clave Anónima:**
   - Settings → API → Project API keys → `anon` `public`
   - Esta clave es segura para uso público (protegida por RLS)

4. **Configurar Clave de Servicio (opcional):**
   - Settings → API → Project API keys → `service_role` `secret`
   - ⚠️ **Solo para operaciones de servidor, nunca exponer**

### 3. **Verificar Configuración**

```bash
# Verificar que .env.local no está en git
git status

# Debería mostrar: nothing to commit, working tree clean
# Si aparece .env.local, agregarlo a .gitignore
```

---

## 🔍 Auditoría de Seguridad

### **Comandos de Verificación**

```bash
# Buscar credenciales expuestas en código
grep -r "yinhukkubomcyolkrahg" . --exclude-dir=node_modules
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . --exclude-dir=node_modules

# Verificar archivos en .gitignore
cat .gitignore | grep -E "\\.env"

# Verificar archivos que serán commiteados
git ls-files | grep -E "\\.env"
```

### **Checklist de Seguridad**

- [ ] ✅ Archivo `.env.local` existe y contiene credenciales reales
- [ ] ✅ Archivo `.env.local` está en `.gitignore`
- [ ] ✅ Documentación pública no contiene credenciales reales
- [ ] ✅ Archivo `env.example` documenta estructura sin valores
- [ ] ✅ RLS habilitado en todas las tablas sensibles
- [ ] ✅ Políticas de acceso configuradas correctamente
- [ ] ✅ Passwords encriptados en base de datos
- [ ] ✅ HTTPS configurado en producción

---

## 🚨 Respuesta a Incidentes

### **Si se Exponen Credenciales:**

1. **Acción Inmediata:**
   - Regenerar claves en Supabase Dashboard
   - Actualizar `.env.local` con nuevas credenciales
   - Verificar logs de acceso en Supabase

2. **Investigación:**
   - Revisar commits del repositorio
   - Identificar cuándo se expusieron
   - Verificar accesos no autorizados

3. **Prevención:**
   - Implementar pre-commit hooks
   - Educar al equipo sobre seguridad
   - Realizar auditorías regulares

### **Contactos de Emergencia:**
- **Dashboard Supabase:** [https://supabase.com/dashboard](https://supabase.com/dashboard)
- **Documentación de Seguridad:** [https://supabase.com/docs/guides/platform/security](https://supabase.com/docs/guides/platform/security)

---

## 📚 Recursos Adicionales

### **Documentación Oficial:**
- [Supabase Security Guide](https://supabase.com/docs/guides/platform/security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### **Herramientas de Seguridad:**
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevenir commits de credenciales
- [truffleHog](https://github.com/trufflesecurity/trufflehog) - Detectar secretos en repositorios
- [GitGuardian](https://www.gitguardian.com/) - Monitoreo continuo de secretos

---

**🔒 Recuerda:** La seguridad es responsabilidad de todo el equipo. Siempre verifica antes de hacer commit y nunca asumas que una credencial es "segura" para compartir públicamente. 