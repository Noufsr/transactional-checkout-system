# Transactional Checkout System

Backend de e-commerce desarrollado con Node.js, Express y MariaDB.

##  Características

- Checkout transaccional con commit/rollback
- Idempotencia mediante Idempotency-Key
- Control de stock concurrente (evita sobreventa)
- Arquitectura modular (controller / service / repository)
- Manejo de errores de negocio (ej: stock insuficiente)

##  Flujo del Checkout

1. Validación de datos
2. Validación de idempotency key
3. Inicio de transacción
4. Creación de venta (PENDING)
5. Procesamiento de items:
   - Validación de producto
   - Descuento de stock (atómico)
   - Creación de sale_items
6. Cálculo y actualización del total
7. Creación de payment (PENDING)
8. Guardado de respuesta para idempotencia
9. Commit

##  Endpoint

### POST /api/checkout

#### Headers:
Idempotency-Key: unique-key
Content-Type: application/json

#### Body:
```json
{
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

#### Respuesta:
```json
{
  "saleId": 1,
  "status": "PENDING",
  "payment": {
    "id": 1,
    "status": "PENDING"
  }
}
```


##### Próximas mejoras:
1. Webhook de pagos
2. Confirmación de transacciones
3. Logs estructurados
