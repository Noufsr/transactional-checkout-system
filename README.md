#  Transactional Checkout System

Backend de e-commerce desarrollado con Node.js, Express y MariaDB, enfocado en resolver problemas reales como **consistencia de datos, concurrencia e idempotencia en sistemas de pago**.

---

##  ¿Qué problema resuelve?

En sistemas de e-commerce reales, el proceso de checkout enfrenta múltiples desafíos:

* Evitar **sobreventa** cuando hay múltiples usuarios comprando al mismo tiempo
* Manejar **reintentos de requests** sin duplicar órdenes o pagos
* Asegurar **consistencia de datos** incluso ante fallos
* Integrarse con sistemas de pago externos (webhooks)

Este proyecto simula ese escenario implementando soluciones reales a estos problemas.

---

##  Conceptos aplicados

* Transacciones (`BEGIN / COMMIT / ROLLBACK`)
* Idempotencia (en checkout y webhooks)
* Control de concurrencia (stock atómico)
* Consistencia de datos
* Separación por capas (Controller → Service → Repository)
* Integración simulada con proveedor de pagos (webhook)

---

##  Arquitectura

```
Controller → Service → Repository → Database
```

* **Controller**: maneja requests HTTP
* **Service**: lógica de negocio
* **Repository**: acceso a base de datos

---

##  Flujo del sistema

###  Checkout

1. Validación del request
2. Verificación de idempotencia (Idempotency-Key)
3. Inicio de transacción
4. Validación de productos
5. Descuento de stock (query atómica)
6. Creación de:

   * sale (PENDING)
   * sale_items
   * payment (PENDING)
7. Guardado de respuesta en idempotencia
8. Commit

---

###  Webhook de pagos

1. Recibe evento externo (`payment.succeeded` / `payment.failed`)
2. Busca payment por `external_id`
3. Verifica idempotencia (si ya fue procesado)
4. Inicia transacción
5. Actualiza:

   * payment.status
   * sale.status
6. Commit

---

##  Ejemplo de uso

### 🛒 Checkout

**POST** `/api/checkout`

Headers:

```
Idempotency-Key: test-123
```

Body:

```json
{
  "items": [
    { "product_id": 1, "quantity": 1 }
  ]
}
```

Response:

```json
{
  "saleId": 3,
  "status": "PENDING",
  "payment": {
    "id": 1,
    "status": "PENDING",
    "external_id": "pay_xxx"
  }
}
```

---

###  Webhook

**POST** `/api/webhook/payment`

```json
{
  "external_id": "pay_xxx",
  "event": "payment.succeeded"
}
```

---

##  Instalación

```bash
git clone https://github.com/Noufsr/transactional-checkout-system.git
cd transactional-checkout-system
npm install
```

---

##  Configuración

Crear archivo `.env` basado en `.env.example`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ecommerce
PORT=3000
```

---

##  Base de datos

Ejecutar:

```sql
SOURCE database/schema.sql;
```

---

##  Ejecutar proyecto

```bash
npm run dev
```

---

##  Datos de prueba

El sistema incluye productos de ejemplo para probar:

* compras exitosas
* errores de stock
* idempotencia

---

##  Decisiones de diseño

* Se utiliza una query atómica para actualizar el stock y evitar race conditions:

  ```sql
  UPDATE products SET stock = stock - ? 
  WHERE id = ? AND stock >= ?
  ```

* Se implementa idempotencia para evitar duplicación de órdenes ante reintentos

* El webhook simula un proveedor externo para desacoplar el sistema de pagos

---

##  Notas

Este proyecto fue desarrollado como práctica de backend, simulando un flujo real de e-commerce con foco en problemas que aparecen en producción.

---

##  Posibles mejoras

* Integración con proveedor de pagos real
* Sistema de reembolsos
* Autenticación y autorización
* Tests automatizados
* Dockerización

---
