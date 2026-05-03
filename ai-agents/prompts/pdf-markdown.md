Quiero que proceses el siguiente PDF y generes el contenido en formato Markdown dentro de un bloque de código (```md ... ```), para que no se renderice en HTML.

## Objetivo
- NO quiero un resumen.
- Quiero el contenido fiel al documento original.
- Puedes reescribir ligeramente para mejorar claridad, pero sin cambiar el significado.

## Reglas
1. Mantener la estructura original del documento (títulos, secciones, flujo).
2. Si un texto es ambiguo o poco claro:
   - Reescribirlo de forma más clara.
   - Añadir una mejora debajo usando este formato:
      Mejora: explicación breve y precisa.
3. No inventar contenido que no esté en el documento.
4. No resumir ni omitir partes importantes.
5. Evitar redundancias innecesarias si el PDF repite ideas visuales.
6. No usar emojis para titulos o secciones, a menos que el PDF los incluya explícitamente.
7. Convertir gráficos o imágenes en:
   - Explicaciones textuales claras
   - Interpretación del mensaje del gráfico

## Uso de Markdown (IMPORTANTE)
7. Usar correctamente elementos de Markdown cuando aplique:
   - Tablas → si el PDF tiene datos tabulares
   - Listas → para enumeraciones o pasos
   - Bloques de código → si hay ejemplos técnicos
8. Si hay gráficos complejos:
   - Representarlos usando Mermaid cuando sea posible
   - Elegir el tipo adecuado:
     - flowchart → procesos
     - pie → proporciones
     - graph/line → tendencias
   - Si no es posible Mermaid, explicar claramente en texto

## Formato de salida
- Todo dentro de un único bloque:
  ```md
  ...