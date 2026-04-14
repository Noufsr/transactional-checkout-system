# Transactional Checkout System

Backend de e-commerce desarrollado con Node.js, Express y MariaDB, enfocado en resolver problemas reales como **consistencia de datos, concurrencia e idempotencia en sistemas de pago**.

---

## Instalación

```bash
git clone https://github.com/Noufsr/transactional-checkout-system.git
cd transactional-checkout-system
npm install
```

---

## Configuración

Crear archivo `.env` basado en `.env.example`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ecommerce
DB_TEST_NAME=ecommerce_test
PORT=3000
```

---

## Base de datos

```sql
SOURCE database/schema.sql;
```

El schema incluye la estructura completa y datos de prueba (productos de ejemplo).

---

## Ejecutar proyecto

```bash
npm run dev
```

---

## Tests

### Tests unitarios

```bash
npm test
```

### Tests de integración

Requieren una base de datos separada:

```sql
CREATE DATABASE ecommerce_test;
USE ecommerce_test;
SOURCE database/schema.sql;
```

---

## Ejemplo de uso

### Checkout

**POST** `/api/checkout`

Headers:
```
Idempotency-Key: test-123
```

Body:
```json
{
  "items": [
    { "productId": 1, "quantity": 1 }
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

### Webhook de pagos

**POST** `/api/webhook/payment`

```json
{
  "external_id": "pay_xxx",
  "event": "payment.succeeded"
}
```

---

## ¿Qué problema resuelve?

En sistemas de e-commerce reales, el proceso de checkout enfrenta múltiples desafíos:

- Evitar **sobreventa** cuando hay múltiples usuarios comprando al mismo tiempo
- Manejar **reintentos de requests** sin duplicar órdenes o pagos
- Asegurar **consistencia de datos** incluso ante fallos
- Integrarse con sistemas de pago externos (webhooks)

Este proyecto simula ese escenario implementando soluciones reales a estos problemas.

---

## Arquitectura

```
Controller → Service → Repository → Database
```

- **Controller**: maneja requests HTTP
- **Service**: lógica de negocio
- **Repository**: acceso a base de datos

---

## Flujo del sistema

### Checkout

1. Validación del request
2. Verificación de idempotencia (`Idempotency-Key`)
3. Inicio de transacción
4. Validación de productos
5. Descuento de stock (query atómica)
6. Creación de `sale`, `sale_items` y `payment` en estado `PENDING`
7. Guardado de respuesta en idempotencia
8. Commit

### Webhook de pagos

1. Recibe evento externo (`payment.succeeded` / `payment.failed`)
2. Busca payment por `external_id`
3. Verifica idempotencia (si ya fue procesado)
4. Inicia transacción
5. Actualiza `payment.status` y `sale.status`
6. Commit

---

## Decisiones de diseño

**Stock atómico** — se usa una query condicional para evitar race conditions:

```sql
UPDATE products SET stock = stock - ?
WHERE id = ? AND stock >= ?
```

**Idempotencia** — cada request incluye un `Idempotency-Key`. Si la key ya existe, se retorna la respuesta cacheada sin crear nada nuevo. Aplica tanto en checkout como en webhooks.

**Separación por capas** — la lógica de negocio vive en el Service, sin filtrarse al Controller ni al Repository.

---

## Posibles mejoras

- Integración con proveedor de pagos real
- Sistema de reembolsos
- Autenticación y autorización (JWT)
- Dockerización
