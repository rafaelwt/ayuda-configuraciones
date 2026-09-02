Quiero que proceses el siguiente PDF y generes su contenido en formato Markdown, conservando las imágenes que no puedan representarse fielmente con Mermaid, y entregando el resultado como un archivo ZIP (ver sección "Formato de salida").

## Objetivo
- NO quiero un resumen.
- Quiero el contenido fiel al documento original.
- Puedes reescribir ligeramente para mejorar claridad, pero sin cambiar el significado.

## Reglas de contenido
1. Mantener la estructura original del documento (títulos, secciones, flujo).
2. Si un texto es ambiguo o poco claro:
   - Reescribirlo de forma más clara.
   - Añadir una mejora debajo usando este formato:
     Mejora: explicación breve y precisa.
3. No inventar contenido que no esté en el documento.
4. No resumir ni omitir partes importantes.
5. Evitar redundancias innecesarias si el PDF repite ideas visuales.
6. No usar emojis en títulos o secciones, a menos que el PDF los incluya explícitamente.

## Uso de Markdown
7. Usar correctamente elementos de Markdown cuando aplique:
   - Tablas → si el PDF tiene datos tabulares
   - Listas → para enumeraciones o pasos
   - Bloques de código → si hay ejemplos técnicos

## Tratamiento de gráficos e imágenes
8. Para cada gráfico o imagen del PDF, decidir en este orden:
   1. **Mermaid**, solo si la representación es fiel y no pierde información:
      - flowchart → procesos
      - pie → proporciones
      - xychart-beta → tendencias y series numéricas
      - sequenceDiagram → interacciones entre componentes
   2. **Conservar la imagen original** en cualquier otro caso: diagramas de arquitectura de redes, fórmulas manuscritas, capturas de pantalla, fotografías, gráficos con muchos detalles, figuras con anotaciones, o cualquier imagen cuya versión Mermaid sería una aproximación y no una réplica.
9. Regla de decisión: ante la duda, conservar la imagen. Es preferible una imagen original a un diagrama Mermaid que simplifique o distorsione el contenido.
10. Imágenes conservadas:
    - Extraerlas del PDF en su resolución original (no recomprimir ni reducir).
    - Guardarlas en la carpeta `images/` con nombre secuencial y descriptivo:
      `images/fig-01-arquitectura-lstm.png`, `images/fig-02-curva-perdida.png`, etc.
    - Referenciarlas en el Markdown con ruta relativa:
      `![Descripción breve de la figura](images/fig-01-arquitectura-lstm.png)`
    - Debajo de cada imagen, añadir siempre:
      - La leyenda o caption original del PDF (si existe).
      - Una explicación textual clara del contenido de la imagen.
      - La interpretación del mensaje que transmite.
11. Imágenes representadas con Mermaid:
    - Incluir el diagrama en un bloque ```mermaid.
    - Añadir debajo la misma explicación e interpretación que en la regla 10.
12. Imágenes puramente decorativas (logos, fondos, separadores) pueden omitirse, indicándolo con una nota breve solo si aportan contexto (por ejemplo, el logo de la institución en la portada).

## Formato de salida
13. El entregable es un único archivo ZIP con esta estructura:
    ```
    nombre-del-documento.zip
    ├── nombre-del-documento.md
    └── images/
        ├── fig-01-....png
        ├── fig-02-....png
        └── ...
    ```
    - El `.md` debe usar únicamente rutas relativas a `images/`, de modo que funcione al descomprimir en cualquier ubicación.
    - Usar el mismo nombre base (en kebab-case, sin espacios ni acentos) para el ZIP y el `.md`.
14. Si el PDF no contiene ninguna imagen que deba conservarse, entregar solo el `.md` (sin ZIP ni carpeta `images/`).
15. Al finalizar, mostrar en el chat un breve inventario de figuras: número de figura, nombre de archivo, y si fue conservada como imagen o convertida a Mermaid.