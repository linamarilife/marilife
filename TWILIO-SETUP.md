# 🚀 Configuración de Twilio para SMS Automáticos

**Pasos para conectar Twilio con tu funnel ACA:**

## 📱 PASO 1: Obtener Credenciales de Twilio

1. **Inicia sesión** en tu cuenta Twilio: https://console.twilio.com
2. En el **Dashboard**, encuentra tu **"Account SID"** y **"Auth Token"**
   - Account SID: Empieza con `AC...`
   - Auth Token: Es tu clave secreta
3. **Toma captura de pantalla** o copia estos valores

## 📞 PASO 2: Obtener Número de Teléfono

1. En el menú izquierdo, ve a **"Phone Numbers"** → **"Manage"** → **"Buy a Number"**
2. **Compra un número de teléfono** (usa los $15 de crédito)
   - Precio: ~$1-2/mes
   - Elige un número con código de área **561** (Florida) si está disponible
3. **Anota el número** (ej: `+1561XXXYYYY`)

## 🔧 PASO 3: Configurar Variables de Entorno

1. Abre el archivo `.env` en `/home/lina/Escritorio/aca-funnel/.env`
2. **Agrega estas líneas** (reemplaza con tus datos reales):

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1561XXXYYYY
```

**Ejemplo real:**
```env
TWILIO_ACCOUNT_SID=ACabc123def456ghi789jkl012mno345
TWILIO_AUTH_TOKEN=abc123def456ghi789jkl012mno345pqr
TWILIO_PHONE_NUMBER=+15611234567
```

## ✅ PASO 4: Probar Configuración

1. **Reinicia el servidor:**
   ```bash
   cd /home/lina/Escritorio/aca-funnel
   pkill -f "next"
   npm run dev
   ```

2. **Prueba con un lead real:**
   - Ve a http://localhost:3000
   - Llena el formulario con tu número real
   - Deberías recibir un SMS en 30 segundos

## ⚙️ PASO 5: Configurar Cron Job (Opcional)

Para enviar follow-ups automáticos cada hora:

```bash
# Editar crontab
crontab -e

# Agregar esta línea (ajusta la ruta)
0 * * * * cd /home/lina/Escritorio/aca-funnel && node scripts/twilio-followup.js >> /home/lina/aca-funnel-cron.log 2>&1
```

**Prueba manual del script:**
```bash
cd /home/lina/Escritorio/aca-funnel
node scripts/twilio-followup.js
```

## 🔍 SOLUCIÓN DE PROBLEMAS

### ❌ "accountSid must start with AC"
- Verifica que tu Account SID empiece con `AC`
- No incluyas comillas en el `.env`

### ❌ No llegan los SMS
1. Verifica que el número esté en formato E.164: `+1561XXXYYYY`
2. Confirma que tienes saldo en Twilio
3. Revisa los logs del servidor: `tail -f server.log`

### ❌ Error de autenticación
- Asegúrate que el Auth Token sea correcto
- No lo hayas regenerado sin actualizar el `.env`

## 📊 MONITOREO

1. **Dashboard Twilio:** Ve a https://console.twilio.com → "Monitor" → "Logs" → "Messaging"
2. **Ver SMS enviados:** Cada SMS cuesta ~$0.0075 (menos de 1¢)
3. **Saldo:** $15 ≈ 2,000 SMS

## 🎯 QUÉ HACE TWILIO EN TU FUNNEL

### ✅ **SMS Instantáneo al Lead:**
```
"Hola María, somos Marilife. ¡Gracias por revisar su subsidio ACA!
Calificó para $200/mes en ahorros. Un agente licenciado le 
llamará pronto al 561-XXX-YYYY. Responda STOP para cancelar."
```

### ✅ **SMS de Follow-up Automático:**
- **24 horas después:** Recordatorio
- **72 horas después:** "Open Enrollment termina pronto"
- **7 días después:** "Última oportunidad"

### ✅ **Notificación a Ti (Email):**
- Ya está implementado: recibes email en `linamarilife@gmail.com`
- Twilio añade la capa de SMS

## 🚀 PRÓXIMOS PASOS DESPUÉS DE TWILIO

1. **Deploy a Vercel** (URL pública en 5 minutos)
2. **Personalizar branding** (colores/logo exactos de Marilife)
3. **Configurar Google Analytics** (tracking de conversiones)
4. **Crear campañas de Facebook/Google Ads**

## 💬 ¿NECESITAS AYUDA?

**Envíame:**
1. **Captura de pantalla** de tu Dashboard Twilio (oculta Auth Token)
2. **Tu número de Twilio** asignado
3. **Cualquier error** que veas en los logs

**O puedo ayudarte en tiempo real si compartes tu pantalla.**

---

**⏱️ Tiempo estimado:** 15-20 minutos  
**💰 Costo:** $1-2/mes (número) + $0.0075/SMS  
**📈 ROI:** Cada SMS aumenta conversión en 15-20% → más enrollments → más comisiones

**¡Tu funnel ACA estará 100% automatizado con SMS!** 🚀