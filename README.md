# MotoGear Admin

Panel administrativo de MotoGear para gestionar la ficha comercial y el
inventario del ordenador de a bordo.

## Flujo recomendado

1. En **Productos y stock**, pulsa **Ordenador MotoGear**.
2. Completa la categoría, descripción e imágenes y mantén el estado en
   **Borrador** mientras preparas la ficha.
3. Usa **Próximamente** para enseñar el producto sin aceptar compras.
4. Introduce SKU, precio de venta y stock real antes de cambiarlo a
   **Disponible**.
5. El listado avisa cuando el stock alcanza el umbral configurado. Cuando llega
   a cero tras un pago, el backend cambia el estado a **Sin stock**.

La plantilla usa el slug `ordenador-bordo-kawasaki`, que es el identificador que
consume la portada pública de MotoGear.
